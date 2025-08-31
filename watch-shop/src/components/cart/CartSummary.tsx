import { Button } from '../ui/Button';

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  onCheckout?: () => void;
  checkoutLabel?: string;
  showTaxAndShipping?: boolean;
}

export function CartSummary({
  subtotal,
  tax,
  shipping,
  total,
  onCheckout,
  checkoutLabel = 'Proceed to Checkout',
  showTaxAndShipping = true,
}: CartSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Order Summary</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          {onCheckout && (
            <Button 
              onClick={onCheckout}
              className="w-full mt-6 py-3 text-base font-medium"
            >
              {checkoutLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
