import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
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

interface StandardLookupFieldProps {
  label: string;
  value?: string;
  selectedText?: string;
  entityName: string;
  onChange: (id: string | undefined) => void;
  onSearch?: (searchTerm: string) => Promise<LookupOption[]>;
  onNavigate?: (id: string) => void;
  onTextChange?: (text: string) => void;
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
  fieldLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#323130',
    marginBottom: '4px',
    display: 'block',
  },
  fieldLabelRequired: {
    color: '#a4262c',
    paddingLeft: '4px',
  },
  customFieldContainer: {
    position: 'relative',
    border: '1px solid #605e5c',
    borderRadius: '2px',
    minHeight: '32px',
    padding: '5px 8px',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    transition: 'border-color 0.2s',
    selectors: {
      '&:hover': {
        borderColor: '#323130',
      },
      '&:focus-within': {
        borderColor: '#0078d4',
        borderWidth: '2px',
        padding: '4px 7px',
      },
    },
  },
  customFieldContainerDisabled: {
    backgroundColor: '#f3f2f1',
    borderColor: '#c8c6c4',
    cursor: 'not-allowed',
  },
  customFieldContainerError: {
    borderColor: '#a4262c',
    selectors: {
      '&:hover': {
        borderColor: '#a4262c',
      },
      '&:focus-within': {
        borderColor: '#a4262c',
      },
    },
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    backgroundColor: '#e1dfdd',
    borderRadius: '16px',
    fontSize: '14px',
    color: '#323130',
    maxWidth: '100%',
  },
  chipClickable: {
    cursor: 'pointer',
    selectors: {
      '&:hover': {
        backgroundColor: '#d2d0ce',
      },
    },
  },
  chipText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginRight: '4px',
    flex: 1,
  },
  chipRemoveButton: {
    minWidth: '16px',
    width: '16px',
    height: '16px',
    padding: 0,
    marginLeft: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    color: '#605e5c',
    selectors: {
      '&:hover': {
        backgroundColor: '#c8c6c4',
        color: '#323130',
      },
      '&:active': {
        backgroundColor: '#a19f9d',
      },
    },
  },
  errorMessage: {
    fontSize: '12px',
    color: '#a4262c',
    marginTop: '4px',
    display: 'block',
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

export const StandardLookupField: React.FC<StandardLookupFieldProps> = ({
  label,
  value,
  selectedText,
  entityName,
  onChange,
  onSearch,
  onNavigate,
  onTextChange,
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
  const calloutId = useId('standard-lookup-callout');

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
    onTextChange?.(option.text);
    setSearchText('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleDialogSelect = (option: LookupOption) => {
    onChange(option.id);
    onTextChange?.(option.text);
    setDialogSearchText('');
    closeDialog();
  };

  const handleClear = () => {
    onChange(undefined);
    onTextChange?.('');
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
        <Stack.Item grow>
          <div>
            <label className={styles.fieldLabel}>
              {label}
              {required && <span className={styles.fieldLabelRequired}>*</span>}
            </label>
            
            <div 
              ref={inputRef}
              className={`${styles.customFieldContainer} ${
                disabled ? styles.customFieldContainerDisabled : ''
              } ${error ? styles.customFieldContainerError : ''}`}
              style={{ paddingRight: value && selectedText ? '8px' : '36px' }}
            >
              {value && selectedText ? (
                <div className={`${styles.chip} ${onNavigate ? styles.chipClickable : ''}`}>
                  <span 
                    className={styles.chipText} 
                    title={selectedText}
                    onClick={() => onNavigate && value && onNavigate(value)}
                    style={{ cursor: onNavigate ? 'pointer' : 'default' }}
                  >
                    {selectedText}
                  </span>
                  <button
                    className={styles.chipRemoveButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    disabled={disabled}
                    title="Remove"
                    aria-label="Remove selection"
                    type="button"
                  >
                    <span style={{ fontSize: '12px', lineHeight: 1 }}>×</span>
                  </button>
                </div>
              ) : (
                <TextField
                  value={searchText}
                  onChange={handleSearchChange}
                  onFocus={handleFocus}
                  onKeyDown={handleKeyDown}
                  placeholder={`Search ${entityName}...`}
                  disabled={disabled}
                  borderless
                  styles={{
                    root: { width: '100%' },
                    fieldGroup: { 
                      border: 'none',
                      minHeight: '22px',
                      height: '22px',
                    },
                    field: {
                      padding: 0,
                      fontSize: '14px',
                    },
                    wrapper: { 
                      selectors: {
                        '&::after': { display: 'none' }
                      }
                    }
                  }}
                  iconProps={
                    searchText && !disabled
                      ? { 
                          iconName: 'Clear', 
                          onClick: () => setSearchText(''),
                          styles: { root: { fontSize: '12px' } }
                        }
                      : { 
                          iconName: 'Search',
                          styles: { root: { fontSize: '12px' } }
                        }
                  }
                  aria-expanded={showSuggestions}
                  aria-controls={calloutId}
                  aria-autocomplete="list"
                />
              )}
            </div>
            
            {error && <span className={styles.errorMessage}>{error}</span>}
          </div>
        </Stack.Item>

        {showSuggestions && searchText.trim() && !value && (
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
