import { createContext, useContext } from 'react';

export const GroupContext = createContext(null);

export function GroupProvider({ value, children }) {
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export function useGroup() {
  return useContext(GroupContext);
}
