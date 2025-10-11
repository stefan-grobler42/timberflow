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
import { AccountsPage } from './pages/AccountsPage';
import { D365ContactsPage } from './pages/D365ContactsPage';
import { D365ProductsPage } from './pages/D365ProductsPage';
import { D365QuotesPage } from './pages/D365QuotesPage';
import { D365OrdersPage } from './pages/D365OrdersPage';
import { D365AppointmentsPage } from './pages/D365AppointmentsPage';
import { D365EmailsPage } from './pages/D365EmailsPage';

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
          
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/d365contacts" element={<D365ContactsPage />} />
          <Route path="/d365products" element={<D365ProductsPage />} />
          <Route path="/d365quotes" element={<D365QuotesPage />} />
          <Route path="/d365orders" element={<D365OrdersPage />} />
          <Route path="/d365appointments" element={<D365AppointmentsPage />} />
          <Route path="/d365emails" element={<D365EmailsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
