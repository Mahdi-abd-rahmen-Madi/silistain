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
  | 'price-asc' 
  | 'price-desc' 
  | 'name-asc' 
  | 'name-desc';

export interface ShopProps {
  // Add any props if needed
}

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  saveInfo: boolean;
  shippingSameAsBilling: boolean;
  [key: string]: string | boolean; // Index signature for dynamic property access
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
