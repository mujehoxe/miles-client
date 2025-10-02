import { useMemo } from "react";

export type User = { role?: string | null } | null;

export type UserPermissions = {
  export: boolean;
  delete: boolean;
  mapLeads: boolean;
  lead: string[];
};

export default function useUserPermissions(user: User): UserPermissions {
  return useMemo(() => {
    if (!user) return { lead: [], export: false, delete: false, mapLeads: false } as UserPermissions;
    const permissions: UserPermissions = {
      export: false,
      delete: false,
      mapLeads: false,
      lead: ["update_status", "update_source"],
    };

    if (user.role) {
      const role = user.role.toLowerCase();

      if (role === "admin" || role === "superadmin" || role.includes("admin")) {
        permissions.export = true;
        permissions.delete = true;
        permissions.mapLeads = true;
        permissions.lead = ["update_status", "update_source", "update_assigned", "delete_lead"];
      }
      else if (role.includes("lead") || role.includes("manager")) {
        permissions.export = true;
        permissions.lead = ["update_status", "update_source", "update_assigned"];
        permissions.mapLeads = true;
      }
      else {
        permissions.export = true;
      }
    }

    return permissions;
  }, [user]);
}
