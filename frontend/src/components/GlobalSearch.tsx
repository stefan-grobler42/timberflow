import { useState, useEffect } from 'react';
import {
  SearchBox,
  Callout,
  Stack,
  Text,
  Icon,
  DirectionalHint,
  Spinner,
  SpinnerSize,
} from '@fluentui/react';
import { useNavigate } from 'react-router-dom';
import { customerService, userService } from '../services';
import type { Customer, User } from '../types';

interface SearchResult {
  id: number;
  type: 'customer' | 'user' | 'contact' | 'activity';
  title: string;
  subtitle: string;
  url: string;
  icon: string;
}

export const GlobalSearch = () => {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isCalloutVisible, setIsCalloutVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchBoxRef, setSearchBoxRef] = useState<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchText.trim().length > 1) {
      performSearch(searchText);
    } else {
      setResults([]);
      setIsCalloutVisible(false);
    }
  }, [searchText]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    try {
      // Search Customers
      const customers = await customerService.getAll();
      const matchingCustomers = customers.filter(
        (customer: Customer) =>
          customer.accountName?.toLowerCase().includes(lowerQuery) ||
          customer.accountNo?.toLowerCase().includes(lowerQuery) ||
          customer.email?.toLowerCase().includes(lowerQuery) ||
          customer.companyType?.name?.toLowerCase().includes(lowerQuery)
      );

      matchingCustomers.slice(0, 5).forEach((customer: Customer) => {
        searchResults.push({
          id: customer.id,
          type: 'customer',
          title: customer.accountName,
          subtitle: `${customer.accountNo} • ${customer.companyType?.name || 'N/A'}`,
          url: '/customers',
          icon: 'ContactCard',
        });
      });

      // Search Users
      const users = await userService.getAll();
      const matchingUsers = users.filter(
        (user: User) =>
          user.firstName?.toLowerCase().includes(lowerQuery) ||
          user.lastName?.toLowerCase().includes(lowerQuery) ||
          user.email?.toLowerCase().includes(lowerQuery) ||
          user.userCode?.toLowerCase().includes(lowerQuery)
      );

      matchingUsers.slice(0, 5).forEach((user: User) => {
        searchResults.push({
          id: user.id,
          type: 'user',
          title: `${user.firstName} ${user.lastName}`,
          subtitle: `${user.userCode} • ${user.department || 'N/A'}`,
          url: '/users',
          icon: 'Accounts',
        });
      });

      setResults(searchResults.slice(0, 10));
      setIsCalloutVisible(searchResults.length > 0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setSearchText('');
    setIsCalloutVisible(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return 'ContactCard';
      case 'user':
        return 'Accounts';
      case 'contact':
        return 'People';
      case 'activity':
        return 'Timeline';
      default:
        return 'Page';
    }
  };

  return (
    <div ref={setSearchBoxRef}>
      <SearchBox
        placeholder="Search across all modules..."
        value={searchText}
        onChange={(_, value) => setSearchText(value || '')}
        onClear={() => {
          setSearchText('');
          setIsCalloutVisible(false);
        }}
        onFocus={() => {
          if (results.length > 0) {
            setIsCalloutVisible(true);
          }
        }}
        styles={{
          root: {
            width: 350,
            marginLeft: 20,
            marginRight: 20,
          },
        }}
      />

      {searchBoxRef && isCalloutVisible && (
        <Callout
          target={searchBoxRef}
          onDismiss={() => setIsCalloutVisible(false)}
          directionalHint={DirectionalHint.bottomCenter}
          styles={{
            root: {
              width: 400,
              maxHeight: 400,
              overflowY: 'auto',
            },
          }}
        >
          <Stack tokens={{ padding: 8 }}>
            {isSearching ? (
              <Stack
                horizontalAlign="center"
                verticalAlign="center"
                tokens={{ padding: 20 }}
              >
                <Spinner size={SpinnerSize.medium} label="Searching..." />
              </Stack>
            ) : results.length > 0 ? (
              <>
                <Text
                  variant="small"
                  styles={{
                    root: { padding: '8px 12px', color: '#605e5c', fontWeight: 600 },
                  }}
                >
                  Search Results ({results.length})
                </Text>
                {results.map((result) => (
                  <Stack
                    key={`${result.type}-${result.id}`}
                    horizontal
                    verticalAlign="center"
                    tokens={{ childrenGap: 12, padding: '8px 12px' }}
                    onClick={() => handleResultClick(result)}
                    styles={{
                      root: {
                        cursor: 'pointer',
                        borderRadius: 4,
                        ':hover': {
                          backgroundColor: '#f3f2f1',
                        },
                      },
                    }}
                  >
                    <Icon
                      iconName={getResultIcon(result.type)}
                      styles={{ root: { fontSize: 20, color: '#0078d4' } }}
                    />
                    <Stack styles={{ root: { flex: 1 } }}>
                      <Text variant="medium">{result.title}</Text>
                      <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
                        {result.subtitle}
                      </Text>
                    </Stack>
                    <Icon
                      iconName="ChevronRight"
                      styles={{ root: { fontSize: 12, color: '#605e5c' } }}
                    />
                  </Stack>
                ))}
              </>
            ) : (
              <Stack
                horizontalAlign="center"
                verticalAlign="center"
                tokens={{ padding: 20 }}
              >
                <Text>No results found</Text>
              </Stack>
            )}
          </Stack>
        </Callout>
      )}
    </div>
  );
};
