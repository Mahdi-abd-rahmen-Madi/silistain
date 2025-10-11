import { Watch, WatchSpecifications } from "./index";

export interface ProductImage {
  url: string;
  isPrimary?: boolean;
  order?: number;
  preview?: string;
  file?: File;
}

export interface Product extends Omit<Watch, 'image' | 'images' | 'specifications'> {
  // Main product images array with metadata
  images: ProductImage[];
  
  // Discount percentage (0-100)
  offPercentage?: number;
  
  // Individual image URLs for database mapping
  image_url?: string;        // Main image (backward compatibility)
  image_url_1?: string;      // Primary image
  image_url_2?: string | null;
  image_url_3?: string | null;
  image_url_4?: string | null;
  image_url_5?: string | null;
  
  // Product metadata
  featured: boolean;
  discount?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  quantity?: number;
  stock_quantity?: number;   // Database field name for stock
  is_featured?: boolean;     // Database field name for featured
  
  // For backward compatibility
  imageUrl?: string;
  stock?: number;            // Alias for stock_quantity
  
  // Product specifications
  specifications: WatchSpecifications & {
    [key: string]: string | number | boolean;
  };
  
  // Timestamps
  created_at?: string;       // Database timestamp
  updated_at?: string;       // Database timestamp
  createdAt?: Date;          // JavaScript Date object
  updatedAt?: Date;          // JavaScript Date object
}
