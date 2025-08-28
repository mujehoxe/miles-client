import { useState, useCallback } from 'react';

export interface UseLeadsSelectionReturn {
  // Selection state
  selectedLeads: any[];
  
  // Selection actions
  toggleLeadSelection: (lead: any) => void;
  clearSelection: () => void;
  selectAll: (leads: any[]) => void;
  isLeadSelected: (lead: any) => boolean;
  selectedCount: number;
}

/**
 * Custom hook to manage leads selection state and actions
 * Provides a clean interface for handling multi-select operations
 */
export const useLeadsSelection = (): UseLeadsSelectionReturn => {
  const [selectedLeads, setSelectedLeads] = useState<any[]>([]);

  /**
   * Toggle selection of a single lead
   */
  const toggleLeadSelection = useCallback((lead: any) => {
    setSelectedLeads((prev) => {
      const isSelected = prev.some((l) => l._id === lead._id);
      if (isSelected) {
        console.log(`➖ Deselecting lead: ${lead.Name || lead._id}`);
        return prev.filter((l) => l._id !== lead._id);
      } else {
        console.log(`➕ Selecting lead: ${lead.Name || lead._id}`);
        return [...prev, lead];
      }
    });
  }, []);

  /**
   * Clear all selected leads
   */
  const clearSelection = useCallback(() => {
    console.log('🧹 Clearing lead selection');
    setSelectedLeads([]);
  }, []);

  /**
   * Select all provided leads
   */
  const selectAll = useCallback((leads: any[]) => {
    console.log(`✅ Selecting all ${leads.length} leads`);
    setSelectedLeads([...leads]);
  }, []);

  /**
   * Check if a lead is selected
   */
  const isLeadSelected = useCallback((lead: any) => {
    return selectedLeads.some((l) => l._id === lead._id);
  }, [selectedLeads]);

  // Computed property for selected count
  const selectedCount = selectedLeads.length;

  return {
    // Selection state
    selectedLeads,
    
    // Selection actions
    toggleLeadSelection,
    clearSelection,
    selectAll,
    isLeadSelected,
    selectedCount,
  };
};
