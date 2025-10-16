import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  IconButton,
  Stack,
  Text,
  Dialog,
  DialogFooter,
  DefaultButton,
  DetailsList,
  SelectionMode,
  SearchBox,
  Spinner,
  SpinnerSize,
  mergeStyleSets,
} from '@fluentui/react';
import type { IColumn } from '@fluentui/react';
import { useId, useBoolean } from '@fluentui/react-hooks';

export interface LookupOption {
  id: string;
  text: string;
}

interface AsyncLookupFieldProps {
  label: string;
  value?: string;
  selectedText?: string;
  entityName: string;
  onChange: (id: string | undefined) => void;
  onSearch?: (searchTerm: string) => Promise<LookupOption[]>;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const styles = mergeStyleSets({
  selectedValueContainer: {
    padding: '8px 12px',
    backgroundColor: '#f3f2f1',
    borderRadius: '2px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedValueText: {
    color: '#323130',
    fontWeight: 600,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #edebe9',
    borderTop: 'none',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    maxHeight: '200px',
    overflowY: 'auto',
  },
  suggestionItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f2f1',
    transition: 'background-color 0.2s',
    selectors: {
      '&:hover': {
        backgroundColor: '#f3f2f1',
      },
      '&:last-child': {
        borderBottom: 'none',
      },
    },
  },
  suggestionItemSelected: {
    backgroundColor: '#f3f2f1',
  },
  highlightedText: {
    backgroundColor: '#fff4ce',
    fontWeight: 600,
  },
  advancedSearchButton: {
    padding: '8px 16px',
    backgroundColor: '#0078d4',
    color: 'white',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: 600,
    borderTop: '1px solid #edebe9',
    selectors: {
      '&:hover': {
        backgroundColor: '#106ebe',
      },
    },
  },
  dialogContent: {
    minHeight: '400px',
  },
  noResults: {
    padding: '16px',
    textAlign: 'center',
    color: '#605e5c',
  },
  loadingContainer: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const AsyncLookupField: React.FC<AsyncLookupFieldProps> = ({
  label,
  value,
  selectedText,
  entityName,
  onChange,
  onSearch,
  disabled = false,
  required = false,
  error,
}) => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<LookupOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [isDialogOpen, { setTrue: openDialog, setFalse: closeDialog }] = useBoolean(false);
  const [dialogSearchText, setDialogSearchText] = useState('');
  const [allOptions, setAllOptions] = useState<LookupOption[]>([]);
  const [filteredDialogOptions, setFilteredDialogOptions] = useState<LookupOption[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const calloutId = useId('async-lookup-callout');

  const debouncedSearchText = useDebounce(searchText, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchText.trim() || !onSearch) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await onSearch(debouncedSearchText);
        setSuggestions(results.slice(0, 3));
      } catch (err) {
        console.error('Search error:', err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchText, onSearch]);

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  const loadAllOptions = async () => {
    if (!onSearch) return;
    
    setIsSearching(true);
    try {
      const results = await onSearch('');
      setAllOptions(results);
      setFilteredDialogOptions(results);
    } catch (err) {
      console.error('Failed to load options:', err);
      setAllOptions([]);
      setFilteredDialogOptions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdvancedSearchClick = () => {
    loadAllOptions();
    openDialog();
  };

  const handleDialogSearchChange = (_: any, newValue?: string) => {
    const searchValue = newValue || '';
    setDialogSearchText(searchValue);
    
    if (!searchValue.trim()) {
      setFilteredDialogOptions(allOptions);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    const filtered = allOptions.filter(opt => 
      opt.text.toLowerCase().includes(searchLower)
    );
    setFilteredDialogOptions(filtered);
  };

  const handleOptionSelect = (option: LookupOption) => {
    onChange(option.id);
    setSearchText('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleDialogSelect = (option: LookupOption) => {
    onChange(option.id);
    setDialogSearchText('');
    closeDialog();
  };

  const handleClear = () => {
    onChange(undefined);
    setSearchText('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSearchChange = (_: any, newValue?: string) => {
    setSearchText(newValue || '');
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleFocus = () => {
    if (searchText.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (event.key === 'ArrowDown') {
        setShowSuggestions(true);
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleOptionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const highlightText = (text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className={styles.highlightedText}>{part}</span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  const dialogColumns: IColumn[] = [
    {
      key: 'text',
      name: entityName,
      fieldName: 'text',
      minWidth: 200,
      maxWidth: 400,
      isResizable: true,
      onRender: (item: LookupOption) => (
        <Stack 
          onClick={() => handleDialogSelect(item)}
          styles={{ root: { cursor: 'pointer', padding: '4px 0' } }}
        >
          <Text>{item.text}</Text>
        </Stack>
      ),
    },
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Stack tokens={{ childrenGap: 4 }}>
        {value && selectedText && (
          <Stack horizontal horizontalAlign="space-between" className={styles.selectedValueContainer}>
            <Text className={styles.selectedValueText}>{selectedText}</Text>
            <IconButton
              iconProps={{ iconName: 'Clear' }}
              title="Clear selection"
              ariaLabel="Clear selection"
              onClick={handleClear}
              disabled={disabled}
              styles={{ root: { height: 24, width: 24 } }}
            />
          </Stack>
        )}

        <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="end">
          <Stack.Item grow>
            <div ref={inputRef}>
              <TextField
                label={label}
                value={searchText}
                onChange={handleSearchChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder={`Search ${entityName}...`}
                disabled={disabled}
                required={required}
                errorMessage={error}
                iconProps={
                  searchText && !disabled
                    ? { iconName: 'Clear', onClick: () => setSearchText('') }
                    : { iconName: 'Search' }
                }
                aria-expanded={showSuggestions}
                aria-controls={calloutId}
                aria-autocomplete="list"
              />
            </div>
          </Stack.Item>

          <IconButton
            iconProps={{ iconName: 'SearchBookmark' }}
            title="Advanced Search"
            ariaLabel="Advanced Search"
            onClick={handleAdvancedSearchClick}
            disabled={disabled}
            styles={{ 
              root: { 
                height: 32, 
                marginBottom: error ? 20 : 0 
              } 
            }}
          />
        </Stack>

        {showSuggestions && searchText.trim() && (
          <div id={calloutId} className={styles.suggestionsContainer} role="listbox">
            {isSearching ? (
              <div className={styles.loadingContainer}>
                <Spinner size={SpinnerSize.small} label="Searching..." />
              </div>
            ) : suggestions.length > 0 ? (
              <>
                {suggestions.map((option, index) => (
                  <div
                    key={option.id}
                    ref={(el) => (suggestionRefs.current[index] = el)}
                    className={`${styles.suggestionItem} ${
                      index === selectedIndex ? styles.suggestionItemSelected : ''
                    }`}
                    onClick={() => handleOptionSelect(option)}
                    role="option"
                    aria-selected={index === selectedIndex}
                  >
                    <Text variant="medium">
                      {highlightText(option.text, searchText)}
                    </Text>
                  </div>
                ))}
                <div
                  className={styles.advancedSearchButton}
                  onClick={handleAdvancedSearchClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleAdvancedSearchClick();
                    }
                  }}
                >
                  Advanced Search
                </div>
              </>
            ) : (
              <div className={styles.noResults}>
                <Text variant="small">No results found</Text>
                <div
                  className={styles.advancedSearchButton}
                  onClick={handleAdvancedSearchClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleAdvancedSearchClick();
                    }
                  }}
                  style={{ marginTop: '8px' }}
                >
                  Advanced Search
                </div>
              </div>
            )}
          </div>
        )}
      </Stack>

      <Dialog
        hidden={!isDialogOpen}
        onDismiss={closeDialog}
        dialogContentProps={{
          title: `Search ${entityName}`,
          subText: `Select a ${entityName.toLowerCase()} from the list below`,
        }}
        modalProps={{
          isBlocking: false,
          styles: { main: { maxWidth: 600, minWidth: 500 } },
        }}
      >
        <Stack tokens={{ childrenGap: 16 }} className={styles.dialogContent}>
          <SearchBox
            placeholder={`Search ${entityName}...`}
            value={dialogSearchText}
            onChange={handleDialogSearchChange}
            autoFocus
          />

          {isSearching ? (
            <div className={styles.loadingContainer}>
              <Spinner size={SpinnerSize.medium} label="Loading..." />
            </div>
          ) : (
            <DetailsList
              items={filteredDialogOptions}
              columns={dialogColumns}
              selectionMode={SelectionMode.none}
              isHeaderVisible={true}
              compact={false}
              styles={{
                root: {
                  maxHeight: '300px',
                  overflowY: 'auto',
                },
              }}
            />
          )}
        </Stack>

        <DialogFooter>
          <DefaultButton onClick={closeDialog} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </div>
  );
};
