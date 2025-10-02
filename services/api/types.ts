// API Types and Interfaces

export interface FilterOptions {
  searchTerm: string;
  searchBoxFilters: string[];
  selectedAgents: string[];
  selectedStatuses: string[];
  selectedSources: string[];
  selectedTags: string[];
  dateRange: [Date | null, Date | null];
  dateFor: string;
  leadType?: 'community' | 'marketing';
}

export interface LeadRequestOptions {
  includeNonAssigned?: boolean;
  viewAllLeads?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface LeadsResponse {
  data: any[];
  totalLeads: number;
}

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
  requiresReminder?: "yes" | "no" | "optional";
}

export interface TagsResponse {
  options: FilterOption[];
  hasMore: boolean;
  totalCount: number;
}

export interface Campaign {
  _id: string;
  Tag: string;
  leadCount: number;
  pendingLeadsCount?: number;
}

export interface CampaignsResponse {
  data: Campaign[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
