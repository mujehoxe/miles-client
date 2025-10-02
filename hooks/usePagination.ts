import { useCallback, useState } from "react";

export interface UsePaginationProps {
  initialPage?: number;
  initialPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface UsePaginationReturn {
  // Pagination state
  currentPage: number;
  leadsPerPage: number;
  totalPages: number;

  // Pagination actions
  setCurrentPage: (page: number) => void;
  setLeadsPerPage: (size: number) => void;
  setTotalPages: (total: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

/**
 * Custom hook to manage pagination state and actions
 * Provides a clean interface for handling pagination operations
 */
export const usePagination = ({
  initialPage = 0,
  initialPageSize = 10,
  onPageChange,
  onPageSizeChange,
}: UsePaginationProps = {}): UsePaginationReturn => {
  const [currentPage, setCurrentPageState] = useState(initialPage);
  const [leadsPerPage, setLeadsPerPageState] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(0);

  /**
   * Set current page and trigger callback
   */
  const setCurrentPage = useCallback(
    (page: number) => {
            setCurrentPageState(page);
      onPageChange?.(page);
    },
    [onPageChange]
  );

  /**
   * Set leads per page and trigger callback
   */
  const setLeadsPerPage = useCallback(
    (size: number) => {
            setLeadsPerPageState(size);
      // Reset to first page when changing page size
      setCurrentPageState(0);
      onPageSizeChange?.(size);
    },
    [onPageSizeChange]
  );

  /**
   * Navigation helper functions
   */
  const goToFirstPage = useCallback(() => {
    setCurrentPage(0);
  }, [setCurrentPage]);

  const goToLastPage = useCallback(() => {
    if (totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [setCurrentPage, totalPages]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  }, [setCurrentPage, currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [setCurrentPage, currentPage]);

  // Computed properties for navigation state
  const canGoNext = currentPage < totalPages - 1;
  const canGoPrevious = currentPage > 0;

  return {
    // Pagination state
    currentPage,
    leadsPerPage,
    totalPages,

    // Pagination actions
    setCurrentPage,
    setLeadsPerPage,
    setTotalPages,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    canGoNext,
    canGoPrevious,
  };
};
