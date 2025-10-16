import { useState, useEffect, useMemo } from 'react';

interface UsePaginationProps<T> {
  items: T[];
  initialPageSize?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  paginatedItems: T[];
  totalPages: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export function usePagination<T>({
  items,
  initialPageSize = 50,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / pageSize)),
    [items.length, pageSize]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize]);

  return {
    currentPage,
    pageSize,
    paginatedItems,
    totalPages,
    setCurrentPage,
    setPageSize,
  };
}
