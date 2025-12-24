import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-canvas text-primary selection:bg-accent selection:text-primary font-sans">
      {/* Subtle warm glow in top right corner similar to reference */}
      <div className="fixed top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-[#FFE8A3]/40 to-transparent blur-[120px] rounded-full pointer-events-none -translate-y-1/3 translate-x-1/3"></div>
      
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 py-8 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Layout;