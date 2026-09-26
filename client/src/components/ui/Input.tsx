import React, { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ 
  className = '', 
  ...props 
}, ref) => {
  return (
    <input 
      ref={ref}
      className={`w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-base md:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all ${className}`}
      {...props}
    />
  );
});
Input.displayName = 'Input';
