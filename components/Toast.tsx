import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // Animate in
    const timer = setTimeout(() => {
      setVisible(false); // Animate out
      setTimeout(onClose, 300); // Wait for animation to finish before calling parent onClose
    }, 4700);

    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  const baseClasses = "fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white transition-all duration-300 ease-in-out z-50 flex items-center gap-3";
  const typeClasses = {
    success: 'bg-gradient-to-r from-green-500 to-teal-500',
    error: 'bg-gradient-to-r from-red-500 to-rose-600',
  };
  const visibilityClasses = visible ? 'transform translate-y-0 opacity-100' : 'transform translate-y-8 opacity-0';

  const Icon = () => {
    if (type === 'success') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${visibilityClasses}`} role="alert">
      <Icon />
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Cerrar notificación">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
         </svg>
      </button>
    </div>
  );
};
