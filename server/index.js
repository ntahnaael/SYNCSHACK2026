const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');

const PORT = Number(process.env.PORT || 3001);
const DATA_DIR = path.join(__dirname, '..', 'data');
const IMAGE_DIR = path.join(DATA_DIR, 'event-images');
const PINS_FILE = path.join(DATA_DIR, 'pins.json');
const IMAGES_FILE = path.join(DATA_DIR, 'images.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/event-images', express.static(IMAGE_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, IMAGE_DIR),
    filename: (req, file, cb) => {
      const safeEventId = String(req.params.eventId).replace(/[^a-zA-Z0-9_-]/g, '_');
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${safeEventId}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function readPins() {
  try {
    return JSON.parse(await fs.readFile(PINS_FILE, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return [];
  }
}

async function writePins(pins) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PINS_FILE, JSON.stringify(pins, null, 2) + '\n');
}

async function readImages() {
  try { return JSON.parse(await fs.readFile(IMAGES_FILE, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
}

app.get('/api/pins', async (_req, res) => {
  try { res.json(await readPins()); } catch { res.status(500).json({ error: 'Could not read pins' }); }
});

app.post('/api/pins', async (req, res) => {
  try {
    const pin = { ...req.body, id: req.body.id || `pin-${Date.now()}` };
    const pins = await readPins();
    pins.push(pin);
    await writePins(pins);
    res.status(201).json(pin);
  } catch { res.status(500).json({ error: 'Could not save pin' }); }
});

app.put('/api/pins/:id', async (req, res) => {
  try {
    const pins = await readPins();
    const index = pins.findIndex((pin) => pin.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Pin not found' });
    pins[index] = { ...req.body, id: req.params.id };
    await writePins(pins);
    res.json(pins[index]);
  } catch { res.status(500).json({ error: 'Could not update pin' }); }
});

app.delete('/api/pins/:id', async (req, res) => {
  try {
    const pins = await readPins();
    await writePins(pins.filter((pin) => pin.id !== req.params.id));
    res.status(204).end();
  } catch { res.status(500).json({ error: 'Could not delete pin' }); }
});

app.post('/api/events/:eventId/images', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image is required' });
  const image = { id: path.parse(req.file.filename).name, uri: `/event-images/${req.file.filename}`, createdAt: new Date().toISOString() };
  readImages().then(async (images) => {
    images[req.params.eventId] = [...(images[req.params.eventId] || []), image];
    await fs.writeFile(IMAGES_FILE, JSON.stringify(images, null, 2) + '\n');
    res.status(201).json({ image: { ...image, uri: `http://localhost:${PORT}${image.uri}` } });
  }).catch(() => res.status(500).json({ error: 'Could not save image metadata' }));
});

app.get('/api/images', async (_req, res) => {
  try {
    const images = await readImages();
    for (const list of Object.values(images)) for (const image of list) image.uri = `http://localhost:${PORT}${image.uri}`;
    res.json(images);
  } catch { res.status(500).json({ error: 'Could not read images' }); }
});

fs.mkdir(IMAGE_DIR, { recursive: true }).then(() => {
  app.listen(PORT, () => console.log(`SYNCSHACK local backend listening on http://localhost:${PORT}`));
});
