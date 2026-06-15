import { useState } from 'react';
import { Stack, Nav, IconButton } from '@fluentui/react';
import type { INavLinkGroup } from '@fluentui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobileWorkerRoute = location.pathname.startsWith('/mobile/');

  if (isMobileWorkerRoute) {
    return <>{children}</>;
  }

  const hiddenNavGroupNames = new Set(['My Work', 'Customers', 'Sales', 'Procurement', 'Dispatch', 'Installation']);

  const allNavLinkGroups: INavLinkGroup[] = [
    {
      links: [
        {
          key: 'home',
          name: 'Home',
          url: '/',
          icon: 'Home',
        },
        {
          key: 'recent',
          name: 'Recent',
          url: '#',
          icon: 'Recent',
          isExpanded: false,
          links: [],
        },
        {
          key: 'pinned',
          name: 'Pinned',
          url: '#',
          icon: 'Pinned',
          isExpanded: false,
          links: [],
        },
      ],
    },
    {
      name: 'My Work',
      links: [
        {
          key: 'activities',
          name: 'Activities',
          url: '/activities',
          icon: 'Timeline',
        },
        {
          key: 'dashboards',
          name: 'Dashboards',
          url: '/dashboards',
          icon: 'ViewDashboard',
        },
      ],
    },
    {
      name: 'Customers',
      links: [
        {
          key: 'accounts',
          name: 'Accounts',
          url: '/accounts',
          icon: 'ContactCard',
        },
        {
          key: 'd365contacts',
          name: 'Contacts',
          url: '/d365contacts',
          icon: 'People',
        },
      ],
    },
    {
      name: 'Sales',
      links: [
        {
          key: 'quotes',
          name: 'Quotes',
          url: '/quotes',
          icon: 'Documentation',
        },
        {
          key: 'd365orders',
          name: 'Orders',
          url: '/d365orders',
          icon: 'ShoppingCart',
        },
        {
          key: 'tenders',
          name: 'Tenders',
          url: '/tenders',
          icon: 'FileRequest',
        },
      ],
    },
    {
      name: 'Procurement',
      links: [
        {
          key: 'procurement',
          name: 'Procurement',
          url: '/procurement',
          icon: 'QuickNote',
        },
      ],
    },
    {
      name: 'Production',
      links: [
        {
          key: 'production',
          name: 'Production',
          url: '/production',
          icon: 'Manufacturing',
        },
        {
          key: 'production-planner',
          name: 'Production Planner',
          url: '/production-planner',
          icon: 'Calendar',
        },
        {
          key: 'mobile-job-time',
          name: 'Mobile Job Time',
          url: '/mobile/job-time',
          icon: 'Clock',
        },
        {
          key: 'schedule-blocks',
          name: 'Schedule Blocks',
          url: '/schedule-blocks',
          icon: 'CalendarWorkWeek',
        },
      ],
    },
    {
      name: 'Dispatch',
      links: [
        {
          key: 'trips',
          name: 'Trips',
          url: '/trips',
          icon: 'NavigateForward',
        },
        {
          key: 'loads',
          name: 'Loads',
          url: '/loads',
          icon: 'DeliveryTruck',
        },
      ],
    },
    {
      name: 'Installation',
      links: [
        {
          key: 'installations',
          name: 'Installations',
          url: '/installations',
          icon: 'ConstructionCone',
        },
        {
          key: 'subcontractor-deductions',
          name: 'Sub-Contractor Deductions',
          url: '/subcontractor-deductions',
          icon: 'Money',
        },
        {
          key: 'subcontractors',
          name: 'Sub-Contractors',
          url: '/subcontractors',
          icon: 'PeopleRepeat',
        },
      ],
    },
    {
      name: 'Settings',
      links: [
        {
          key: 'd365products',
          name: 'Products',
          url: '/d365products',
          icon: 'Product',
        },
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
          key: 'salerepresentatives',
          name: 'Sale Representatives',
          url: '/salerepresentatives',
          icon: 'RecruitmentManagement',
        },
        {
          key: 'vehicles',
          name: 'Vehicles',
          url: '/vehicles',
          icon: 'Car',
        },
        {
          key: 'suppliers',
          name: 'Suppliers',
          url: '/suppliers',
          icon: 'Group',
        },
        {
          key: 'settings',
          name: 'System Settings',
          url: '/settings',
          icon: 'Settings',
        },
      ],
    },
  ];

  // Hide undecided modules from the sidebar only; routes and pages remain available directly.
  const navLinkGroups = allNavLinkGroups.filter(group => !group.name || !hiddenNavGroupNames.has(group.name));

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
              width: sidebarCollapsed ? 0 : 250,
              minWidth: sidebarCollapsed ? 0 : 250,
              flexShrink: 0,
              backgroundColor: '#f3f2f1',
              borderRight: sidebarCollapsed ? 'none' : '1px solid #e1dfdd',
              overflowY: 'auto',
              overflowX: 'hidden',
              transition: 'width 0.2s ease, min-width 0.2s ease',
            },
          }}
        >
          {!sidebarCollapsed && (
            <>
              <Stack 
                horizontal 
                horizontalAlign="end" 
                styles={{ 
                  root: { 
                    padding: '8px 8px 0 8px',
                    borderBottom: '1px solid #e1dfdd',
                  } 
                }}
              >
                <IconButton
                  iconProps={{ iconName: 'ChevronLeft' }}
                  title="Close sidebar"
                  ariaLabel="Close sidebar"
                  onClick={() => setSidebarCollapsed(true)}
                  styles={{
                    root: {
                      color: '#605e5c',
                    },
                    rootHovered: {
                      backgroundColor: '#edebe9',
                    },
                  }}
                />
              </Stack>
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
            </>
          )}
        </Stack.Item>
        
        {sidebarCollapsed && (
          <Stack.Item
            styles={{
              root: {
                position: 'absolute',
                left: 0,
                top: 68,
                zIndex: 10,
              },
            }}
          >
            <IconButton
              iconProps={{ iconName: 'GlobalNavButton' }}
              title="Open sidebar"
              ariaLabel="Open sidebar"
              onClick={() => setSidebarCollapsed(false)}
              styles={{
                root: {
                  backgroundColor: '#f3f2f1',
                  borderRadius: '0 4px 4px 0',
                  border: '1px solid #e1dfdd',
                  borderLeft: 'none',
                },
                rootHovered: {
                  backgroundColor: '#edebe9',
                },
              }}
            />
          </Stack.Item>
        )}

        <Stack.Item
          grow
          styles={{
            root: {
              overflowY: 'auto',
              overflowX: 'hidden',
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
