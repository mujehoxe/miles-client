import * as SecureStore from "expo-secure-store";

// Define permission types
export interface UserPermissions {
  lead?: string[];
  deal?: string[];
  user?: string[];
  // Add more permission categories as needed
}

// Mock permissions - in a real app, these would come from the API/auth system
const mockPermissions: UserPermissions = {
  lead: [
    "view_sensetive_details",
    "update_status",
    "update_source",
    "update_info",
    "delete",
    "create",
    "view_all",
  ],
  deal: ["view_all", "create", "update", "delete"],
  user: ["view_all", "manage"],
};

/**
 * Get user permissions from secure storage or API
 * In a real app, this would fetch from the authentication system
 */
export const getUserPermissions = async (): Promise<UserPermissions | null> => {
  try {
    // Try to get permissions from secure storage
    const storedPermissions = await SecureStore.getItemAsync(
      "user_permissions"
    );

    if (storedPermissions) {
      return JSON.parse(storedPermissions);
    }

    // Return mock permissions for now
    return mockPermissions;
  } catch (error) {
    console.error(error);
    return mockPermissions;
  }
};

/**
 * Store user permissions in secure storage
 */
export const storeUserPermissions = async (
  permissions: UserPermissions
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(
      "user_permissions",
      JSON.stringify(permissions)
    );
  } catch (error) {
    console.error(error);
  }
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (
  permissions: UserPermissions | null,
  category: keyof UserPermissions,
  permission: string
): boolean => {
  if (!permissions || !permissions[category]) {
    return false;
  }

  return permissions[category]!.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (
  permissions: UserPermissions | null,
  category: keyof UserPermissions,
  permissionList: string[]
): boolean => {
  if (!permissions || !permissions[category]) {
    return false;
  }

  return permissionList.some((permission) =>
    permissions[category]!.includes(permission)
  );
};

/**
 * Get all permissions for a category
 */
export const getPermissionsForCategory = (
  permissions: UserPermissions | null,
  category: keyof UserPermissions
): string[] => {
  if (!permissions || !permissions[category]) {
    return [];
  }

  return permissions[category]!;
};
