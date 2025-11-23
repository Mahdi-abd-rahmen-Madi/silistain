import { Watch, WatchSpecifications } from "./index";

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  order?: number;
  preview?: string;
  file?: File;
}

// Extend Watch but override conflicting or ambiguous fields
export interface Product
  extends Omit<
    Watch,
    | 'image'
    | 'images'
    | 'specifications'
    | 'price'        // We'll redefine price logic
    | 'featured'     // Normalize naming
    | 'stock'        // Use stock_quantity consistently
  > {
  brand?: string; // e.g., "SKMEI", "Curren", etc.
  // ✅ PRICING — clear separation
  price: number;                // ← current/sale price (what user pays)
  original_price?: number | null; // ← original/MSRP price (for strikethrough)

  // ✅ DISCOUNT
  offPercentage?: number;       // 0–100, editable in admin

  // ✅ IMAGES
  images: ProductImage[];
  image_url?: string;           // backward compat
  image_url_1?: string;
  image_url_2?: string | null;
  image_url_3?: string | null;
  image_url_4?: string | null;
  image_url_5?: string | null;
  imageUrl?: string;            // alias

  // ✅ STOCK & FEATURED — normalize naming
  stock_quantity: number;       // ← primary source of truth (from DB)
  is_featured: boolean;         // ← primary source (from DB)

  // Aliases for convenience (optional)
  stock?: number;               // = stock_quantity
  featured?: boolean;           // = is_featured
  isNew?: boolean;
  isBestSeller?: boolean;

  // ✅ SPECIFICATIONS
  specifications: WatchSpecifications & {
    [key: string]: string | number | boolean;
  };

  // ✅ TIMESTAMPS
  created_at?: string;          // ISO string from Supabase
  updated_at?: string;
  createdAt?: Date;             // parsed Date (client-side)
  updatedAt?: Date;
}