export interface CheckoutFormData {
    firstName: string;
    lastName?: string;
    email?: string;
    phone: string;
    address: string;
    governorate: string;
    delegation: string;
    saveInfo: boolean;
    notes?: string;
    // Add any other checkout form fields
  }