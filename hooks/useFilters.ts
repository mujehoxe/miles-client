import { FilterOptions } from "../services/api";
import { useCallback, useState } from "react";

export interface UseFiltersProps {
  initialFilters?: Partial<FilterOptions>;
  onFiltersChange?: (filters: FilterOptions) => void;
}

export interface UseFiltersReturn {
  // Filter state
  filters: FilterOptions;
  showFilters: boolean;

  // Filter actions
  updateFilters: (newFilters: FilterOptions) => void;
  setShowFilters: (show: boolean) => void;
  clearFilters: () => void;
}

/**
 * Custom hook to manage filter state and actions
 * Provides a clean interface for handling filter operations
 */
export const useFilters = ({
  initialFilters = {},
  onFiltersChange,
}: UseFiltersProps = {}): UseFiltersReturn => {
  // Default filter values
  const defaultFilters: FilterOptions = {
    searchTerm: "",
    searchBoxFilters: ["LeadInfo"],
    selectedAgents: [],
    selectedStatuses: [],
    selectedSources: [],
    selectedTags: [],
    dateRange: [null, null],
    dateFor: "LeadIntroduction",
    leadType: 'marketing', // Default to marketing leads
    ...initialFilters,
  };

  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Update filters with new values
   */
  const updateFilters = useCallback(
    (newFilters: FilterOptions) => {
            setFilters(newFilters);
      onFiltersChange?.(newFilters);
    },
    [onFiltersChange]
  );

  /**
   * Clear all filters to default values
   */
  const clearFilters = useCallback(() => {
        const clearedFilters = { ...defaultFilters };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  }, [defaultFilters, onFiltersChange]);

  return {
    // Filter state
    filters,
    showFilters,

    // Filter actions
    updateFilters,
    setShowFilters,
    clearFilters,
  };
};
