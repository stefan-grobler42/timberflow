// Layout - Header Component
import React from 'react';

export const Header = ({ title, user }) => {
  // Placeholder implementation
  return (
    <header className="header">
      <div className="header-content">
        <h1>{title || 'Millennium ERP'}</h1>
        <div className="user-info">
          <span>Welcome, {user?.name || 'User'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;