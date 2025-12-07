import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full rounded-xl border border-slate-200 bg-white
            ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5
            text-slate-900 placeholder:text-slate-400
            focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none
            transition-all duration-200
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
            dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};