export interface WatchSpecifications {
  movement: string;
  caseMaterial: string;
  caseDiameter: string;
  waterResistance: string;
  powerReserve: string;
  functions: string;
  [key: string]: string | number | boolean; // For any additional properties
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface Watch {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  images: ProductImage[];
  category: string;
  description: string;
  specifications: WatchSpecifications;
  features: string[];
  inStock: number;
  isFeatured?: boolean;
  onSale?: boolean;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  [key: string]: any; // For any additional properties
}

export interface Filters {
  category: string;
  brand: string;
  priceRange: [number, number];
  searchQuery: string;
}

export type SortOption = 
  | 'featured' 
  | 'price_low_high' 
  | 'price_high_low' 
  | 'newest' 
  | 'name_az' 
  | 'name_za';

export interface ShopProps {
  // Add any props if needed
}

export interface CheckoutFormData {
  firstName: string;
  lastName?: string;  // Made optional
  email?: string;     // Made optional
  phone: string;
  address: string;
  city?: string;      // Made optional
  governorate: string;
  delegation: string;
  zipCode: string;
  country?: string;   // Made optional
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  saveInfo: boolean;
  shippingSameAsBilling: boolean;
  [key: string]: string | boolean | undefined; // Updated to include undefined for optional fields
}

export interface OrderDetails {
  orderId: string;
  customerName: string;
  email: string;
  total: number;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
}
