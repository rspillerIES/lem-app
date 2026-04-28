import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  padding = 'md',
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
