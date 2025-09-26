"use client";
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import Toast from './Toast';
import { cn } from '../../../utils/cn';

const ToastContainer = ({ 
  toasts = [], 
  position = 'top-right',
  onRemove,
  maxToasts = 5 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  // Limit the number of visible toasts
  const visibleToasts = toasts.slice(-maxToasts);

  const containerElement = (
    <div
      className={cn(
        'fixed z-50 pointer-events-none',
        positionClasses[position]
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="flex flex-col space-y-3 pointer-events-auto">
        {visibleToasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              zIndex: 1000 + index,
              // Stacking effect for multiple toasts
              transform: `translateY(${index * -2}px) scale(${1 - index * 0.02})`,
            }}
          >
            <Toast
              {...toast}
              onRemove={onRemove}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(containerElement, document.body);
};

export default ToastContainer;