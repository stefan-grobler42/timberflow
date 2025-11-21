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
import { DuplicateDetectionPage } from './pages/DuplicateDetectionPage';
import { QuotesList } from './pages/QuotesList';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { InstallationsPage } from './pages/InstallationsPage';
import { TripsPage } from './pages/TripsPage';
import { LoadsPage } from './pages/LoadsPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SubContractorsPage } from './pages/SubContractorsPage';
import { SubContractorDeductionsPage } from './pages/SubContractorDeductionsPage';

initializeIcons();

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/contacts" element={<div style={{ padding: '20px' }}>
            <h2>Contacts</h2>
            <p>Contact data is available in the following locations:</p>
            <ul>
              <li><a href="#/d365contacts">D365 Contacts</a> - Migrated contacts from Dynamics 365</li>
            </ul>
            <p><em>Note: Full data consolidation (merging legacy and D365 contacts) is planned for a future release.</em></p>
          </div>} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/roles" element={<div>Roles (Coming Soon)</div>} />
          <Route path="/companies" element={<div>Company Types (Coming Soon)</div>} />
          
          <Route path="/designers" element={<DesignersPage />} />
          <Route path="/salerepresentatives" element={<SaleRepresentativesPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          
          <Route path="/quotes" element={<QuotesList />} />
          <Route path="/quotes-legacy" element={<QuotesPage />} />
          <Route path="/tenders" element={<TendersPage />} />
          <Route path="/procurement" element={<ProcurementPage />} />
          <Route path="/pricing" element={<PricingCalculationsPage />} />
          <Route path="/production" element={<ProductionPage />} />
          
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/loads" element={<LoadsPage />} />
          <Route path="/installations" element={<InstallationsPage />} />
          <Route path="/subcontractors" element={<SubContractorsPage />} />
          <Route path="/subcontractor-deductions" element={<SubContractorDeductionsPage />} />
          
          {/* Legacy routes - kept for backward compatibility */}
          <Route path="/installation" element={<InstallationProgressPage />} />
          <Route path="/logistics" element={<LogisticsPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          
          {/* D365 migrated data - accessible via direct URL for admin/reference */}
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/d365contacts" element={<D365ContactsPage />} />
          
          <Route path="/d365products" element={<D365ProductsPage />} />
          <Route path="/d365quotes" element={<D365QuotesPage />} />
          <Route path="/d365orders" element={<D365OrdersPage />} />
          <Route path="/d365appointments" element={<D365AppointmentsPage />} />
          <Route path="/d365emails" element={<D365EmailsPage />} />
          <Route path="/duplicates" element={<DuplicateDetectionPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
