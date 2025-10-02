
export type AgentNode = {
  value: string;
  label: string;
  role?: string;
  children?: AgentNode[];
};

export const getUsersFromAgents = (agentsList: AgentNode[]) => {
  const flattenAgents = (agentList: AgentNode[]): { _id: string; username: string; Role: string }[] => {
    let result: { _id: string; username: string; Role: string }[] = [];
    agentList.forEach((agent) => {
      if (agent.value === "non-assigned") {
        return;
      }

      result.push({
        _id: agent.value,
        username: agent.label,
        Role: agent.role || "agent",
      });
      if (agent.children) {
        result = result.concat(flattenAgents(agent.children));
      }
    });
    return result;
  };

  return flattenAgents(agentsList);
};

export const getFlattenedAgents = (agentsList: AgentNode[]) => {
  const flattenAgents = (agentList: AgentNode[]): AgentNode[] => {
    let result: AgentNode[] = [];
    agentList.forEach((agent) => {
      if (agent.value === "non-assigned") {
        return;
      }

      result.push({
        value: agent.value,
        label: agent.label,
        role: agent.role,
      });
      if (agent.children) {
        result = result.concat(flattenAgents(agent.children));
      }
    });
    return result;
  };

  return flattenAgents(agentsList);
};

export const getAllUsersFromAgents = (agentsList: AgentNode[]) => {
  const flattenAgents = (agentList: AgentNode[]): any[] => {
    let result: any[] = [];
    agentList.forEach((agent) => {
      result.push({
        _id: agent.value,
        username: agent.label,
        Role: agent.role || "agent",
        value: agent.value,
        label: agent.label,
      });
      if (agent.children) {
        result = result.concat(flattenAgents(agent.children));
      }
    });
    return result;
  };

  return flattenAgents(agentsList);
};

export const processAgentsForFilters = (agentsList: AgentNode[], user?: { role?: string | null }) => {
  if (!user || !agentsList || agentsList.length === 0) {
    return agentsList;
  }

  const isAdmin =
    !!user.role && (user.role === "admin" || user.role === "superAdmin" || user.role.toLowerCase().includes("admin"));

  if (!isAdmin) {
    return agentsList;
  }

  const processedAgents = [...agentsList];

  const hasNonAssigned = processedAgents.some((agent) => agent.value === "non-assigned");

  if (!hasNonAssigned) {
    processedAgents.unshift({
      value: "non-assigned",
      label: "Non Assigned",
      role: "system",
      children: undefined,
    });
  }

  return processedAgents;
};
