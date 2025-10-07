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
          key: 'customers',
          name: 'Customers',
          url: '/customers',
          icon: 'ContactCard',
        },
        {
          key: 'contacts',
          name: 'Contacts',
          url: '/contacts',
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
              padding: '0 16px',
              height: 44,
              borderBottom: '1px solid #4a99c4',
            } 
          }}
        >
          <Stack.Item styles={{ root: { flex: '0 0 auto' } }}>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
              <img 
                src="/millennium-logo.png" 
                alt="Millennium Logo" 
                style={{ height: 40, cursor: 'pointer' }}
                onClick={() => navigate('/')}
              />
              <span 
                style={{ color: 'white', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
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
              backgroundColor: '#59AAD5',
              borderRight: '1px solid #4a99c4',
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
              },
              groupContent: {
                marginBottom: 0,
              },
              link: {
                backgroundColor: 'transparent',
                color: 'white',
                selectors: {
                  ':hover': {
                    backgroundColor: '#4a99c4',
                    color: 'white',
                  },
                  '.is-selected': {
                    backgroundColor: '#54C3D6',
                    color: 'white',
                  },
                },
              },
              compositeLink: {
                backgroundColor: 'transparent',
                selectors: {
                  ':hover': {
                    backgroundColor: '#4a99c4',
                  },
                  '.is-selected': {
                    backgroundColor: '#54C3D6',
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
