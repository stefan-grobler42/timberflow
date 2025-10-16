// Helper function to resolve lookup GUID to friendly name
export const resolveLookup = (guid: string | undefined | null, lookupMap: Map<string, string>): string => {
  if (!guid || !lookupMap) {
    return '-';
  }
  
  const name = lookupMap.get(guid.toLowerCase());
  return name || '-';
};
