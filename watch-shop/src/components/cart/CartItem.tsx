import { XMarkIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CartItem as CartItemType } from '../../context/CartContext';
import { formatPrice } from '../../lib/utils';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  variant?: 'drawer' | 'page';
}

export function CartItem({ item, onUpdateQuantity, onRemove, variant = 'page' }: CartItemProps) {
  return (
    <div className={`flex py-6 ${variant === 'page' ? 'flex-col md:flex-row' : ''}`}>
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        <img
          src={item.image as string || '/placeholder-watch.jpg'}
          alt={item.name}
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className={`${variant === 'page' ? 'mt-4 md:mt-0 md:ml-6' : 'ml-4'} flex flex-1 flex-col`}>
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3>{item.name}</h3>
            <p className="ml-4">{formatPrice(item.price)}</p>
          </div>
        </div>
        
        <div className="flex flex-1 items-end justify-between text-sm mt-2">
          <div className="flex items-center border rounded-md">
            <button
              type="button"
              className="px-2 py-1 text-gray-600 hover:bg-gray-100"
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="px-3 py-1">{item.quantity}</span>
            <button
              type="button"
              className="px-2 py-1 text-gray-600 hover:bg-gray-100"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center text-sm"
            onClick={() => onRemove(item.id)}
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
