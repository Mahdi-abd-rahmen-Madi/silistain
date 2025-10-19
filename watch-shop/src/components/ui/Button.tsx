import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive'; // 👈 added 'destructive'
  size?: 'default' | 'sm' | 'lg';
  asChild?: boolean;
  className?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
          {
            // Default button (accent background, white text)
            'bg-accent text-text-on-accent hover:bg-accent-dark': variant === 'default',

            // Destructive button (for delete actions, etc.)
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',

            // Outline button (transparent background, primary text, border)
            'bg-transparent border border-border text-text-primary hover:bg-bg-secondary':
              variant === 'outline',

            // Ghost button (transparent background, accent text)
            'bg-transparent hover:bg-bg-secondary text-accent': variant === 'ghost',

            // Link button (accent text with underline on hover)
            'text-accent underline-offset-4 hover:underline': variant === 'link',

            // Sizes
            'h-10 py-2 px-4': size === 'default',
            'h-9 px-3 rounded-md text-sm': size === 'sm',
            'h-12 px-8 rounded-lg text-base': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
export type { ButtonProps };