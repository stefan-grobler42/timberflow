import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initializeIcons } from '@fluentui/react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { UsersPage } from './pages/UsersPage';
import { CustomersPage } from './pages/CustomersPage';

initializeIcons();

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/contacts" element={<div>Contacts (Coming Soon)</div>} />
          <Route path="/activities" element={<div>Activities (Coming Soon)</div>} />
          <Route path="/roles" element={<div>Roles (Coming Soon)</div>} />
          <Route path="/companies" element={<div>Company Types (Coming Soon)</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
