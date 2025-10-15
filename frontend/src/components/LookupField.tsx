import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  IconButton,
  Callout,
  DirectionalHint,
  Stack,
  Text,
  Spinner,
  SpinnerSize,
  Icon,
  DefaultButton,
  PrimaryButton,
  ChoiceGroup,
  Separator
} from '@fluentui/react';
import { useId, useBoolean } from '@fluentui/react-hooks';

export interface LookupOption {
  id: string;
  text: string;
  subText?: string;
  record?: any;
}

interface LookupFieldProps {
  label: string;
  value?: string;
  selectedText?: string;
  options: LookupOption[];
  onChange: (id: string | undefined, text: string | undefined, record?: any) => void;
  onSearch?: (query: string) => Promise<LookupOption[]>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onCreateNew?: () => void;
  onAdvancedSearch?: () => void;
  showPeekView?: boolean;
  peekViewContent?: React.ReactNode;
  entityName?: string;
}

export const LookupField: React.FC<LookupFieldProps> = ({
  label,
  value,
  selectedText,
  options,
  onChange,
  onSearch,
  placeholder,
  required,
  disabled,
  error,
  onCreateNew,
  onAdvancedSearch,
  showPeekView,
  peekViewContent,
  entityName = 'Record'
}) => {
  const [searchText, setSearchText] = useState(selectedText || '');
  const [filteredOptions, setFilteredOptions] = useState<LookupOption[]>([]);
  const [isCalloutVisible, { setTrue: showCallout, setFalse: hideCallout }] = useBoolean(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showPeek, { setTrue: openPeek, setFalse: closePeek }] = useBoolean(false);
  const [createMode, setCreateMode] = useState(false);
  
  const textFieldRef = useRef<HTMLDivElement>(null);
  const calloutId = useId('callout');
  const peekButtonId = useId('peek-button');

  // Filter options based on search text
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredOptions(options);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = options.filter(
      opt => 
        opt.text.toLowerCase().includes(searchLower) ||
        opt.subText?.toLowerCase().includes(searchLower)
    );
    
    setFilteredOptions(filtered);
  }, [searchText, options]);

  // Update search text when selectedText prop changes
  useEffect(() => {
    if (selectedText !== undefined) {
      setSearchText(selectedText);
    }
  }, [selectedText]);

  const handleSearchChange = async (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    const value = newValue || '';
    setSearchText(value);
    setSelectedIndex(-1);
    
    if (!isCalloutVisible) {
      showCallout();
    }

    // If onSearch callback provided, use it for async search
    if (onSearch && value.trim()) {
      setIsSearching(true);
      try {
        const results = await onSearch(value);
        setFilteredOptions(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleOptionSelect = (option: LookupOption) => {
    setSearchText(option.text);
    onChange(option.id, option.text, option.record);
    hideCallout();
    setCreateMode(false);
  };

  const handleClear = () => {
    setSearchText('');
    onChange(undefined, undefined);
    setCreateMode(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isCalloutVisible) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        showCallout();
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          handleOptionSelect(filteredOptions[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        hideCallout();
        break;
    }
  };

  const handleFocus = () => {
    showCallout();
  };

  const handleCreateNewClick = () => {
    if (onCreateNew) {
      hideCallout();
      onCreateNew();
    }
  };

  const handleAdvancedSearchClick = () => {
    if (onAdvancedSearch) {
      hideCallout();
      onAdvancedSearch();
    }
  };

  const renderNoResults = () => {
    if (isSearching) {
      return (
        <Stack horizontal horizontalAlign="center" tokens={{ padding: 20 }}>
          <Spinner size={SpinnerSize.small} label="Searching..." />
        </Stack>
      );
    }

    if (!onCreateNew) {
      return (
        <Stack tokens={{ padding: 20 }}>
          <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
            No records found
          </Text>
        </Stack>
      );
    }

    return (
      <Stack tokens={{ padding: 20, childrenGap: 12 }}>
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <Icon iconName="Info" styles={{ root: { color: '#605e5c', fontSize: 16, marginTop: 2 } }} />
          <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
            No records found matching "{searchText}"
          </Text>
        </Stack>
        
        <Separator />
        
        <Stack tokens={{ childrenGap: 8 }}>
          <ChoiceGroup
            options={[
              { key: 'create', text: `Create new ${entityName}` }
            ]}
            selectedKey={createMode ? 'create' : undefined}
            onChange={() => setCreateMode(true)}
          />
          
          {createMode && (
            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <PrimaryButton
                text="Create"
                iconProps={{ iconName: 'Add' }}
                onClick={handleCreateNewClick}
              />
              <DefaultButton
                text="Cancel"
                onClick={() => setCreateMode(false)}
              />
            </Stack>
          )}
        </Stack>
      </Stack>
    );
  };

  return (
    <Stack tokens={{ childrenGap: 4 }}>
      <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="end">
        <Stack.Item grow>
          <div ref={textFieldRef}>
            <TextField
              label={label}
              value={searchText}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder={placeholder || `Search for ${entityName}...`}
              required={required}
              disabled={disabled}
              errorMessage={error}
              iconProps={searchText ? { iconName: 'Clear', onClick: handleClear } : undefined}
              styles={{
                root: { position: 'relative' },
                field: { paddingRight: onAdvancedSearch ? 60 : 30 }
              }}
            />
          </div>
        </Stack.Item>
        
        {onAdvancedSearch && (
          <IconButton
            iconProps={{ iconName: 'Search' }}
            title="Advanced Search"
            ariaLabel="Advanced Search"
            onClick={handleAdvancedSearchClick}
            styles={{ 
              root: { 
                height: 32, 
                marginBottom: error ? 20 : 0 
              } 
            }}
          />
        )}
        
        {showPeekView && value && peekViewContent && (
          <IconButton
            id={peekButtonId}
            iconProps={{ iconName: 'RedEye' }}
            title="Preview"
            ariaLabel="Preview record"
            onClick={openPeek}
            styles={{ 
              root: { 
                height: 32, 
                marginBottom: error ? 20 : 0 
              } 
            }}
          />
        )}
      </Stack>

      {isCalloutVisible && textFieldRef.current && (
        <Callout
          id={calloutId}
          target={textFieldRef.current}
          onDismiss={hideCallout}
          directionalHint={DirectionalHint.bottomLeftEdge}
          isBeakVisible={false}
          styles={{ 
            root: { 
              minWidth: textFieldRef.current.offsetWidth,
              maxWidth: 400,
              maxHeight: 300,
              overflow: 'auto'
            } 
          }}
        >
          {filteredOptions.length === 0 ? (
            renderNoResults()
          ) : (
            <Stack>
              {filteredOptions.map((option, index) => (
                <Stack
                  key={option.id}
                  onClick={() => handleOptionSelect(option)}
                  tokens={{ padding: '8px 12px' }}
                  styles={{
                    root: {
                      cursor: 'pointer',
                      backgroundColor: index === selectedIndex ? '#f3f2f1' : 'transparent',
                      ':hover': {
                        backgroundColor: '#f3f2f1'
                      }
                    }
                  }}
                >
                  <Text variant="medium">{option.text}</Text>
                  {option.subText && (
                    <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
                      {option.subText}
                    </Text>
                  )}
                </Stack>
              ))}
            </Stack>
          )}
        </Callout>
      )}

      {showPeek && (
        <Callout
          target={`#${peekButtonId}`}
          onDismiss={closePeek}
          directionalHint={DirectionalHint.bottomRightEdge}
          isBeakVisible={true}
          styles={{ 
            root: { 
              padding: 20,
              minWidth: 300,
              maxWidth: 400
            } 
          }}
        >
          {peekViewContent}
        </Callout>
      )}
    </Stack>
  );
};
