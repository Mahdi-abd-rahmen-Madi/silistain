import { Watch } from '../types';

// Type guard to check if an object matches the Watch interface
export function isWatch(watch: any): watch is Watch {
  return (
    typeof watch === 'object' && watch !== null &&
    'id' in watch && typeof watch.id === 'number' &&
    'name' in watch && typeof watch.name === 'string' &&
    'brand' in watch && typeof watch.brand === 'string' &&
    'price' in watch && typeof watch.price === 'number' &&
    'image' in watch && typeof watch.image === 'string' &&
    'images' in watch && Array.isArray(watch.images) &&
    'category' in watch && typeof watch.category === 'string' &&
    'description' in watch && typeof watch.description === 'string' &&
    'specifications' in watch && typeof watch.specifications === 'object' &&
    'features' in watch && Array.isArray(watch.features) &&
    'inStock' in watch && typeof watch.inStock === 'number'
  );
}

// Type assertion function
export function assertIsWatch(watch: any): asserts watch is Watch {
  if (!isWatch(watch)) {
    throw new Error('Invalid watch data');
  }
}

// Type assertion for the watches array
export function assertIsWatchesArray(watches: any[]): asserts watches is Watch[] {
  if (!Array.isArray(watches) || !watches.every(isWatch)) {
    throw new Error('Invalid watches data');
  }
}
