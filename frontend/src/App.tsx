import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initializeIcons } from '@fluentui/react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { UsersPage } from './pages/UsersPage';
import { CustomersPage } from './pages/CustomersPage';
import { DesignersPage } from './pages/DesignersPage';
import { SaleRepresentativesPage } from './pages/SaleRepresentativesPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { QuotesPage } from './pages/QuotesPage';
import { TendersPage } from './pages/TendersPage';
import { PricingCalculationsPage } from './pages/PricingCalculationsPage';
import { InstallationProgressPage } from './pages/InstallationProgressPage';
import { ProductionPage } from './pages/ProductionPage';
import { LogisticsPage } from './pages/LogisticsPage';
import { DeliveriesPage } from './pages/DeliveriesPage';

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
          
          <Route path="/designers" element={<DesignersPage />} />
          <Route path="/salerepresentatives" element={<SaleRepresentativesPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/tenders" element={<TendersPage />} />
          <Route path="/pricing" element={<PricingCalculationsPage />} />
          <Route path="/installation" element={<InstallationProgressPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/logistics" element={<LogisticsPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
