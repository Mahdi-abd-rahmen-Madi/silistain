import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

type CartAnimationProps = {
  isAnimating: boolean;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  onComplete: () => void;
  imageUrl: string;
};

export function CartAnimation({
  isAnimating,
  startPosition,
  endPosition,
  onComplete,
  imageUrl,
}: CartAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 1000); // Match this with the animation duration
      return () => clearTimeout(timer);
    }
  }, [isAnimating, onComplete]);

  // Calculate the control point for the curve
  const controlPoint = {
    x: (startPosition.x + endPosition.x) / 2,
    y: Math.min(startPosition.y, endPosition.y) - 100, // Adjust this value to control the curve height
  };

  const path = `M ${startPosition.x} ${startPosition.y} Q ${controlPoint.x} ${controlPoint.y}, ${endPosition.x} ${endPosition.y}`;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed z-50 pointer-events-none"
          style={{
            width: '40px',
            height: '40px',
            position: 'fixed',
            left: 0,
            top: 0,
            transform: `translate(${startPosition.x}px, ${startPosition.y}px)`,
          }}
          animate={{
            x: endPosition.x - startPosition.x,
            y: endPosition.y - startPosition.y,
            scale: [1, 1.2, 0.8],
            opacity: [1, 0.9, 0],
          }}
          transition={{
            duration: 0.8,
            ease: [0.34, 1.56, 0.64, 1],
            times: [0, 0.7, 1],
          }}
        >
          <motion.div 
            className="w-full h-full rounded-full overflow-hidden border-2 border-white shadow-lg"
            style={{
              background: 'white',
              padding: '2px',
            }}
          >
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover rounded-full"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
