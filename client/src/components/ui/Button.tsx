import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  size?: 'sm' | 'md' | 'lg'
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Mobile: active:scale-95 active:opacity-90. Desktop: hover:bg-opacity-90 hover:shadow-md hover:-translate-y-0.5
  const activeClasses = "active:scale-95 active:opacity-90 md:active:scale-95 md:hover:shadow-md md:hover:-translate-y-px";

  const variants = {
    primary: "bg-brand-600 text-white focus-visible:ring-brand-500 md:hover:bg-brand-700",
    secondary: "bg-white text-gray-700 border border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 focus-visible:ring-gray-500 md:hover:bg-gray-50 dark:md:hover:bg-gray-800",
    danger: "bg-red-600 text-white focus-visible:ring-red-500 md:hover:bg-red-700",
    ghost: "bg-transparent text-gray-600 dark:text-gray-400 focus-visible:ring-gray-500 md:hover:bg-gray-100 dark:md:hover:bg-gray-800"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-base md:text-sm gap-2",
    lg: "px-6 py-3 text-lg md:text-base gap-2.5"
  };

  return (
    <button 
      className={`${baseClasses} ${activeClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
