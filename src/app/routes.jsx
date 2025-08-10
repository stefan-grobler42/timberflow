// App Shell - Routes Configuration
import React from 'react';

export const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => <div>Dashboard placeholder</div>
  },
  {
    path: '/customers',
    name: 'Customers',
    component: () => <div>Customers placeholder</div>
  },
  {
    path: '/projects',
    name: 'Projects', 
    component: () => <div>Projects placeholder</div>
  }
];

export default routes;