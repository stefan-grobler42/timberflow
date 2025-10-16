import React from 'react';
import { Stack, IconButton, Dropdown, Text } from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const pageSizeOptions: IDropdownOption[] = [
    { key: 50, text: '50 per page' },
    { key: 100, text: '100 per page' },
  ];

  const handlePageSizeChange = (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    if (option) {
      onPageSizeChange(option.key as number);
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <Stack
      horizontal
      horizontalAlign="space-between"
      verticalAlign="center"
      styles={{
        root: {
          padding: '12px 16px',
          borderTop: '1px solid #edebe9',
          backgroundColor: '#faf9f8',
        },
      }}
    >
      <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
        <Dropdown
          options={pageSizeOptions}
          selectedKey={pageSize}
          onChange={handlePageSizeChange}
          styles={{
            dropdown: { width: 130 },
          }}
        />
        <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
          Showing {startRecord}-{endRecord} of {totalRecords} records
        </Text>
      </Stack>

      <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
        <IconButton
          iconProps={{ iconName: 'ChevronLeft' }}
          title="Previous page"
          disabled={currentPage === 1}
          onClick={handlePreviousPage}
          styles={{
            root: { height: 32 },
            rootDisabled: { backgroundColor: 'transparent' },
          }}
        />
        <Text variant="small" styles={{ root: { minWidth: 80, textAlign: 'center' } }}>
          Page {currentPage} of {totalPages}
        </Text>
        <IconButton
          iconProps={{ iconName: 'ChevronRight' }}
          title="Next page"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={handleNextPage}
          styles={{
            root: { height: 32 },
            rootDisabled: { backgroundColor: 'transparent' },
          }}
        />
      </Stack>
    </Stack>
  );
};
