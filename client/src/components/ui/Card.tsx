import React from 'react';

export function Card({ 
  children, 
  className = '', 
  hover = false,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  // Base: padding p-4 (mobile), p-6 (desktop)
  // Shadow: subtle on desktop, flat on mobile
  const baseClasses = "bg-white dark:bg-gray-950 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-gray-800 p-4 md:p-6 transition-all";
  
  // Hover states only apply to desktop and if hover is true
  const hoverClasses = hover ? "md:hover:shadow-lg md:hover:-translate-y-1 md:hover:border-gray-200 dark:md:hover:border-gray-700 cursor-pointer active:scale-[0.98]" : "";

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}
