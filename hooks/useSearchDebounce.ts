import { useCallback, useEffect, useState } from "react";

export interface UseSearchDebounceProps {
  delay?: number;
  onSearchChange?: (searchTerm: string) => void;
}

export interface UseSearchDebounceReturn {
  searchTerm: string;
  debouncedSearchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
}

/**
 * Custom hook to handle debounced search functionality
 * Provides a clean interface for search input with debounced API calls
 */
export const useSearchDebounce = ({
  delay = 500,
  onSearchChange,
}: UseSearchDebounceProps = {}): UseSearchDebounceReturn => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  /**
   * Clear search term
   */
  const clearSearch = useCallback(() => {
        setSearchTerm("");
  }, []);

  // Debounce the search term
  useEffect(() => {
    const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
      onSearchChange?.(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay, onSearchChange]);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    clearSearch,
  };
};
