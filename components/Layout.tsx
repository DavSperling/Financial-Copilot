import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-slate-900 selection:bg-primary-100 selection:text-primary-900">
      {children}
    </div>
  );
};