import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Text,
  DetailsList,
  DetailsListLayoutMode,
  ConstrainMode,
  Selection,
  CommandBar,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  SearchBox,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { d365QuoteService } from '../services/d365Services';
import type { D365Quote } from '../types/millennium';
import * as XLSX from 'xlsx';

export const QuotesList = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<D365Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<D365Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<D365Quote | undefined>();
  const [searchText, setSearchText] = useState('');

  const [selection] = useState(
    new Selection({
      onSelectionChanged: () => {
        const selected = selection.getSelection()[0] as D365Quote | undefined;
        setSelectedQuote(selected);
      },
    })
  );

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [quotes, searchText]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await d365QuoteService.getAll();
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...quotes];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((quote) => {
        return Object.values(quote).some((value) =>
          String(value).toLowerCase().includes(search)
        );
      });
    }

    setFilteredQuotes(filtered);
  };

  const handleNew = () => {
    navigate('/quotes/new');
  };

  const handleEdit = () => {
    if (selectedQuote) {
      navigate(`/quotes/${selectedQuote.id}`);
    }
  };

  const handleRowDoubleClick = (quote: D365Quote) => {
    navigate(`/quotes/${quote.id}`);
  };

  const handleDelete = async () => {
    if (selectedQuote && window.confirm(`Are you sure you want to delete quote "${selectedQuote.name}"?`)) {
      try {
        await d365QuoteService.delete(selectedQuote.id);
        await loadQuotes();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete quote');
      }
    }
  };

  const exportToExcel = () => {
    const exportData = filteredQuotes.map((quote) => ({
      'Quote Number': quote.quoteNumber || '',
      'Name': quote.name || '',
      'Customer ID': quote.customerId || '',
      'Total Amount': quote.totalAmount || 0,
      'Status': getStatusText(quote.statusCode),
      'Effective From': quote.effectiveFrom ? new Date(quote.effectiveFrom).toLocaleDateString() : '',
      'Effective To': quote.effectiveTo ? new Date(quote.effectiveTo).toLocaleDateString() : '',
      'Created On': quote.createdOn ? new Date(quote.createdOn).toLocaleDateString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quotes');
    XLSX.writeFile(wb, `D365_Quotes_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusText = (statusCode?: number): string => {
    switch (statusCode) {
      case 1: return 'Draft';
      case 2: return 'Active';
      case 3: return 'Won';
      case 4: return 'Lost';
      case 5: return 'Closed';
      default: return 'Unknown';
    }
  };

  const columns: IColumn[] = [
    {
      key: 'quoteNumber',
      name: 'Quote Number',
      fieldName: 'quoteNumber',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
    },
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'customerId',
      name: 'Customer',
      fieldName: 'customerId',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
      onRender: (item: D365Quote) => <Text>{item.customerId || '-'}</Text>,
    },
    {
      key: 'totalAmount',
      name: 'Total Amount',
      fieldName: 'totalAmount',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: D365Quote) => <Text>{item.totalAmount ? `R ${item.totalAmount.toFixed(2)}` : '-'}</Text>,
    },
    {
      key: 'statusCode',
      name: 'Status',
      fieldName: 'statusCode',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      onRender: (item: D365Quote) => <Text>{getStatusText(item.statusCode)}</Text>,
    },
    {
      key: 'effectiveFrom',
      name: 'Effective From',
      fieldName: 'effectiveFrom',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: D365Quote) => <Text>{item.effectiveFrom ? new Date(item.effectiveFrom).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'effectiveTo',
      name: 'Effective To',
      fieldName: 'effectiveTo',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: D365Quote) => <Text>{item.effectiveTo ? new Date(item.effectiveTo).toLocaleDateString() : '-'}</Text>,
    },
  ];

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'new',
      text: 'New',
      iconProps: { iconName: 'Add' },
      onClick: handleNew,
    },
    {
      key: 'edit',
      text: 'Edit',
      iconProps: { iconName: 'Edit' },
      disabled: !selectedQuote,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedQuote,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadQuotes,
    },
    {
      key: 'export',
      text: 'Export to Excel',
      iconProps: { iconName: 'ExcelDocument' },
      onClick: exportToExcel,
    },
  ];

  const commandBarFarItems: ICommandBarItemProps[] = [
    {
      key: 'search',
      onRender: () => (
        <SearchBox
          placeholder="Search all columns..."
          value={searchText}
          onChange={(_, value) => setSearchText(value || '')}
          onClear={() => setSearchText('')}
          styles={{ root: { width: 300 } }}
        />
      ),
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { padding: 20 } }}>
      <Text variant="xxLarge">Quotes</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <Stack
        horizontal
        verticalAlign="center"
        tokens={{ childrenGap: 8 }}
        styles={{
          root: {
            padding: '8px 12px',
            backgroundColor: '#faf9f8',
            borderBottom: '1px solid #edebe9',
          },
        }}
      >
        <Text variant="medium" styles={{ root: { marginLeft: 8 } }}>
          {filteredQuotes.length} {filteredQuotes.length === 1 ? 'quote' : 'quotes'}
        </Text>
      </Stack>

      {loading ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading quotes..." />
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <DetailsList
            items={filteredQuotes}
            columns={columns}
            layoutMode={DetailsListLayoutMode.justified}
            constrainMode={ConstrainMode.unconstrained}
            selection={selection}
            selectionPreservedOnEmptyClick
            onItemInvoked={handleRowDoubleClick}
            styles={{
              root: {
                selectors: {
                  '.ms-DetailsRow': {
                    cursor: 'pointer',
                  },
                },
              },
            }}
          />
        </div>
      )}
    </Stack>
  );
};
