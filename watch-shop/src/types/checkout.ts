export interface CheckoutFormData {
    name: string;
    email?: string;
    phone: string;
    address: string;
    governorate: string;
    delegation: string;
    saveInfo: boolean;
    // Add any other checkout form fields
  }