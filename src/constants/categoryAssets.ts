import type { ImageSourcePropType } from 'react-native';

import type { PinCategory } from '@/types';

export const CATEGORY_PIN_IMAGES: Record<PinCategory, ImageSourcePropType> = {
  nature: require('../../assets/images/pin-nature-voxel.png'),
  landmark: require('../../assets/images/pin-landmark-voxel.png'),
  community: require('../../assets/images/pin-community-voxel.png'),
  waterfront: require('../../assets/images/pin-waterfront-voxel.png'),
  food: require('../../assets/images/pin-food-voxel.png'),
};

export const CATEGORY_LEGEND_IMAGES: Record<PinCategory, ImageSourcePropType> = {
  nature: require('../../assets/images/legend-nature-voxel.png'),
  landmark: require('../../assets/images/legend-landmark-voxel.png'),
  community: require('../../assets/images/legend-community-voxel.png'),
  waterfront: require('../../assets/images/legend-waterfront-voxel.png'),
  food: require('../../assets/images/legend-food-voxel.png'),
};
