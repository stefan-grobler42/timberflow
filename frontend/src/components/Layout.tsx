import { Stack, Nav, CommandBar } from '@fluentui/react';
import type { INavLinkGroup, ICommandBarItemProps } from '@fluentui/react';
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

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'title',
      text: 'Millennium Timber Roof ERP',
      iconProps: { iconName: 'Home' },
      onClick: () => {
        navigate('/');
      },
    },
  ];

  const commandBarFarItems: ICommandBarItemProps[] = [
    {
      key: 'globalSearch',
      onRender: () => <GlobalSearch />,
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
        <CommandBar
          items={commandBarItems}
          farItems={commandBarFarItems}
          styles={{
            root: {
              borderBottom: '1px solid #edebe9',
            },
          }}
        />
      </Stack.Item>

      <Stack horizontal styles={{ root: { flex: 1, overflow: 'hidden' } }}>
        <Stack.Item
          styles={{
            root: {
              width: 250,
              borderRight: '1px solid #edebe9',
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
