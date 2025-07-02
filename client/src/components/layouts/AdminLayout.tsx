import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Layout padrão para dashboards administrativos
 * Força fundo branco para evitar problemas de CSS/tema escuro
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`min-h-screen bg-white p-6 ${className}`}
      style={{ 
        backgroundColor: '#ffffff',
        color: '#000000'
      }}
    >
      {children}
    </div>
  );
};

export default AdminLayout;