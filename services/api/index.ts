// Re-export all API functions from their respective modules

// Types
export * from './types';

// Authentication
export { createAuthHeaders, validateAuthToken, clearAuthData } from './auth';


// Leads
export { fetchLeads, buildLeadsRequestBody, getLeadMeetings } from './leads';

// Reminders
export { addReminder, updateReminder, getLeadReminders } from './reminders';

// Users
export { getUsers } from './users';

// Note: The original api.ts file contained many more functions that would need to be moved
// This is a starting point for the refactoring. Additional modules can be created as needed:
// - filters.ts (for status, source, tag filter functions)
// - comments.ts (for comment-related functions)
// - reports.ts (for reporting functions)
// - etc.
