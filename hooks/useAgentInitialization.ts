import { useEffect } from "react";

export default function useAgentInitialization({
  agents,
  user,
  filters,
  updateFilters
}: {
  agents: any[];
  user: any;
  filters: any;
  updateFilters: (filters: any) => void;
}) {
  useEffect(() => {
    if (agents.length > 0 && user && filters.selectedAgents.length === 0) {
      let defaultAgents: string[] = [];

      if (user.role === "superAdmin") {
        // Select all agents for super admin
        const flattenAgents = (agentList: any[]): string[] => {
          let result: string[] = [];
          agentList.forEach((agent) => {
            result.push(agent.value);
            if (agent.children) {
              result = result.concat(flattenAgents(agent.children));
            }
          });
          return result;
        };
        defaultAgents = flattenAgents(agents);
      } else {
        // Find current user in agents list
        const flattenAgents = (agentList: any[]): any[] => {
          let result: any[] = [];
          agentList.forEach((agent) => {
            result.push(agent);
            if (agent.children) {
              result = result.concat(flattenAgents(agent.children));
            }
          });
          return result;
        };

        const allAgents = flattenAgents(agents);
        const currentUserAgent = allAgents.find(
          (agent) => agent.value === user.id
        );
        if (currentUserAgent) {
          defaultAgents = [user.id];
        }
      }

      if (defaultAgents.length > 0) {
        const newFilters = {
          ...filters,
          selectedAgents: defaultAgents,
        };
        updateFilters(newFilters);
      }
    }
  }, [agents, user, filters, updateFilters]);
}
