import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { formatPrice } from '../lib/utils';

// Types
export interface CartItem {
  id: string;
  name?: string;
  price: number;
  quantity: number;
  brand?: string;
  image: string;
  [key: string]: unknown; // Allow for additional properties with unknown type
}

interface CartContextType {
  cartItems: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  cartCount: number;
  subtotal: number;
  tax: number;
  total: number;
  shipping: number;
  addToCart: (watch: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (watchId: string) => void;
  updateQuantity: (watchId: string, newQuantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  calculateSubtotal: () => number;
  calculateTax: () => number;
  calculateTotal: () => number;
  calculateShipping: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'watch_shop_cart';

interface CartProviderProps {
  children: ReactNode;
}

// Constants for calculations
const TAX_RATE = 0.1; // 10% tax
// Free shipping on all orders
const SHIPPING_COST = 0; // Free shipping for all orders

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cart calculations
  const calculateSubtotal = useCallback((): number => {
    return parseFloat(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
  }, [cartItems]);
  
  const calculateTax = useCallback((): number => {
    return 0; // Tax removed as per user request
  }, []);
  
  const calculateShipping = useCallback((): number => {
    return 0; // Always free shipping
  }, []);
  
  const calculateTotal = useCallback((): number => {
    const total = calculateSubtotal() + calculateTax() + calculateShipping();
    return parseFloat(total.toFixed(2));
  }, [calculateSubtotal, calculateTax, calculateShipping]);
  
  // Derived state
  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const shipping = calculateShipping();
  const total = calculateTotal();
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
      }
    } catch (error) {
      console.error('Failed to parse cart from localStorage', error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isLoading]);

  const addToCart = useCallback((watch: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === watch.id);
      
      if (existingItem) {
        // Update quantity if item already in cart
        return prevItems.map((item) => {
          if (item.id === watch.id) {
            return { ...item, quantity: item.quantity + quantity } as CartItem;
          }
          return item;
        });
      }
      
      // Add new item to cart with proper type assertion
      return [...prevItems, { ...watch, quantity } as CartItem];
    });

  }, []);

  const removeFromCart = useCallback((watchId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== watchId));
    toast.success('Item removed from cart');
  }, []);

  const updateQuantity = useCallback((watchId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(watchId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === watchId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const toggleCart = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openCart = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);



  return (
    <CartContext.Provider
      value={{
        cartItems,
        isOpen,
        isLoading,
        cartCount,
        subtotal,
        tax,
        total,
        shipping,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        calculateSubtotal,
        calculateTax,
        calculateTotal,
        calculateShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
