import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Types
export interface CartItem {
  id: number;
  name?: string;
  price: number;
  quantity: number;
  brand?: string;
  [key: string]: unknown; // Allow for additional properties with unknown type
}

interface CartContextType {
  cartItems: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  cartCount: number;
  addToCart: (watch: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (watchId: number) => void;
  updateQuantity: (watchId: number, newQuantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  calculateSubtotal: () => number;
  calculateTax: () => number;
  calculateTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'watch_shop_cart';

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

    toast.success(`${quantity} ${watch.name} added to cart`);
  }, []);

  const removeFromCart = useCallback((watchId: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== watchId));
    toast.success('Item removed from cart');
  }, []);

  const updateQuantity = useCallback((watchId: number, newQuantity: number) => {
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

  const calculateSubtotal = useCallback(() => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  const calculateTax = useCallback(() => {
    return calculateSubtotal() * 0.1; // 10% tax
  }, [calculateSubtotal]);

  const calculateTotal = useCallback(() => {
    return calculateSubtotal() + calculateTax() + 29.99; // $29.99 shipping
  }, [calculateSubtotal, calculateTax]);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const value: CartContextType = {
    cartItems,
    isOpen,
    isLoading,
    cartCount,
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
  };

  return (
    <CartContext.Provider value={value}>
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
