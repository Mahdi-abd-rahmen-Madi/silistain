export interface Municipality {
  id: string;
  name: string;
  nameEn?: string;
  delegation: string;
  governorate: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  delegation: string;
  postalCode: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}
