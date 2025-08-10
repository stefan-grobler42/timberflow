// Layout - Sidebar Component
import React from 'react';

export const Sidebar = ({ children }) => {
  // Placeholder implementation
  return (
    <div className="sidebar">
      <h3>Sidebar</h3>
      <nav>
        <ul>
          <li><a href="/">Dashboard</a></li>
          <li><a href="/customers">Customers</a></li>
          <li><a href="/projects">Projects</a></li>
        </ul>
      </nav>
      {children}
    </div>
  );
};

export default Sidebar;