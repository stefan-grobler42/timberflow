import { Stack, Nav } from '@fluentui/react';
import type { INavLinkGroup } from '@fluentui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinkGroups: INavLinkGroup[] = [
    {
      name: 'CRM',
      links: [
        {
          key: 'accounts',
          name: 'Accounts',
          url: '/accounts',
          icon: 'ContactCard',
        },
        {
          key: 'd365contacts',
          name: 'D365 Contacts',
          url: '/d365contacts',
          icon: 'People',
        },
        {
          key: 'activities',
          name: 'Activities',
          url: '/activities',
          icon: 'Timeline',
        },
      ],
    },
    {
      name: 'Sales & Quotes',
      links: [
        {
          key: 'quotes',
          name: 'Quotes - MRoofing',
          url: '/quotes',
          icon: 'Documentation',
        },
        {
          key: 'tenders',
          name: 'Tenders',
          url: '/tenders',
          icon: 'FileRequest',
        },
        {
          key: 'pricing',
          name: 'Pricing Calculations',
          url: '/pricing',
          icon: 'Calculator',
        },
        {
          key: 'salerepresentatives',
          name: 'Sale Representatives',
          url: '/salerepresentatives',
          icon: 'RecruitmentManagement',
        },
      ],
    },
    {
      name: 'Operations',
      links: [
        {
          key: 'production',
          name: 'Production',
          url: '/production',
          icon: 'Product',
        },
        {
          key: 'installation',
          name: 'Installation Progress',
          url: '/installation',
          icon: 'ProgressLoopInner',
        },
        {
          key: 'logistics',
          name: 'Logistics',
          url: '/logistics',
          icon: 'Shipping',
        },
        {
          key: 'deliveries',
          name: 'Deliveries',
          url: '/deliveries',
          icon: 'DeliveryTruck',
        },
      ],
    },
    {
      name: 'Resources',
      links: [
        {
          key: 'employees',
          name: 'Employees',
          url: '/employees',
          icon: 'PeopleAdd',
        },
        {
          key: 'designers',
          name: 'Designers',
          url: '/designers',
          icon: 'Design',
        },
        {
          key: 'vehicles',
          name: 'Vehicles',
          url: '/vehicles',
          icon: 'Car',
        },
      ],
    },
    {
      name: 'Administration',
      links: [
        {
          key: 'users',
          name: 'Users',
          url: '/users',
          icon: 'Accounts',
        },
        {
          key: 'roles',
          name: 'Roles',
          url: '/roles',
          icon: 'SecurityGroup',
        },
        {
          key: 'companies',
          name: 'Company Types',
          url: '/companies',
          icon: 'CityNext',
        },
      ],
    },
    {
      name: 'Dynamics 365 Data',
      links: [
        {
          key: 'd365products',
          name: 'Products',
          url: '/d365products',
          icon: 'Product',
        },
        {
          key: 'd365quotes',
          name: 'Quotes',
          url: '/d365quotes',
          icon: 'DocumentSet',
        },
        {
          key: 'd365orders',
          name: 'Orders',
          url: '/d365orders',
          icon: 'ShoppingCart',
        },
        {
          key: 'd365appointments',
          name: 'Appointments',
          url: '/d365appointments',
          icon: 'Calendar',
        },
        {
          key: 'd365emails',
          name: 'Emails',
          url: '/d365emails',
          icon: 'Mail',
        },
      ],
    },
  ];

  const handleLinkClick = (ev?: React.MouseEvent<HTMLElement>, item?: any): void => {
    if (item?.url) {
      ev?.preventDefault();
      navigate(item.url);
    }
  };

  return (
    <Stack styles={{ root: { height: '100vh', overflow: 'hidden' } }}>
      <Stack.Item styles={{ root: { position: 'sticky', top: 0, zIndex: 100 } }}>
        <Stack 
          horizontal 
          verticalAlign="center" 
          styles={{ 
            root: { 
              backgroundColor: '#59AAD5',
              padding: '0 20px',
              height: 60,
              borderBottom: '2px solid #4a99c4',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            } 
          }}
        >
          <Stack.Item styles={{ root: { flex: '0 0 auto' } }}>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 16 }}>
              <img 
                src="/millennium-logo.png" 
                alt="Millennium Logo" 
                style={{ height: 48, cursor: 'pointer' }}
                onClick={() => navigate('/')}
              />
              <span 
                style={{ color: 'white', fontWeight: 700, fontSize: 20, cursor: 'pointer', letterSpacing: '-0.5px' }}
                onClick={() => navigate('/')}
              >
                Millennium Timber Roof ERP
              </span>
            </Stack>
          </Stack.Item>
          
          <Stack.Item grow styles={{ root: { display: 'flex', justifyContent: 'center', padding: '0 20px' } }}>
            <GlobalSearch />
          </Stack.Item>
          
          <Stack.Item styles={{ root: { flex: '0 0 auto', width: 200 } }}>
            {/* Spacer for balance */}
          </Stack.Item>
        </Stack>
      </Stack.Item>

      <Stack horizontal styles={{ root: { flex: 1, overflow: 'hidden' } }}>
        <Stack.Item
          styles={{
            root: {
              width: 250,
              backgroundColor: '#f3f2f1',
              borderRight: '1px solid #e1dfdd',
              overflowY: 'auto',
            },
          }}
        >
          <Nav
            groups={navLinkGroups}
            selectedKey={location.pathname.substring(1)}
            onLinkClick={handleLinkClick}
            styles={{
              root: {
                width: 250,
                '& .ms-Nav-groupHeader': {
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#605e5c',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '8px 12px',
                },
              },
              groupContent: {
                marginBottom: 0,
              },
              group: {
                marginTop: 8,
              },
              link: {
                backgroundColor: 'transparent',
                color: '#323130',
                fontSize: 14,
                height: 40,
                lineHeight: 40,
                selectors: {
                  ':hover': {
                    backgroundColor: '#edebe9',
                    color: '#323130',
                  },
                  '.is-selected': {
                    backgroundColor: '#59AAD5',
                    color: 'white',
                  },
                  '.is-selected:hover': {
                    backgroundColor: '#4a99c4',
                    color: 'white',
                  },
                },
              },
              compositeLink: {
                backgroundColor: 'transparent',
                selectors: {
                  ':hover': {
                    backgroundColor: '#edebe9',
                  },
                  '.is-selected': {
                    backgroundColor: '#59AAD5',
                  },
                  '.is-selected:hover': {
                    backgroundColor: '#4a99c4',
                  },
                },
              },
            }}
          />
        </Stack.Item>

        <Stack.Item
          grow
          styles={{
            root: {
              overflowY: 'auto',
              padding: '20px',
              backgroundColor: '#faf9f8',
            },
          }}
        >
          {children}
        </Stack.Item>
      </Stack>
    </Stack>
  );
};
