export interface ProductImage {
  url: string;
  isPrimary?: boolean;
  order?: number;
  preview?: string;
  file?: File;
}

import { Watch, WatchSpecifications } from "./index";

export interface ProductImage {
  url: string;
  isPrimary?: boolean;
  order?: number;
  preview?: string;
  file?: File;
}

export interface Product extends Omit<Watch, 'image' | 'images' | 'specifications'> {
  // Override images to use ProductImage[] instead of string[]
  images: ProductImage[];
  
  // Add any additional properties specific to Product
  featured?: boolean;
  discount?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  quantity?: number;
  
  // For backward compatibility
  imageUrl?: string;
  
  // Add specifications with a more flexible type
  specifications: WatchSpecifications & {
    [key: string]: string | number | boolean;
  };
  
  // Add any other fields that might be needed
  createdAt?: Date;
  updatedAt?: Date;
}
