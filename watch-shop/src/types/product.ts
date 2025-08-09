export interface ProductImage {
  url: string;
  isPrimary?: boolean;
  order?: number;
  preview?: string;
  file?: File;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  // For backward compatibility
  imageUrl?: string;
  // New field for multiple images
  images?: ProductImage[];
  stock: number;
  featured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
