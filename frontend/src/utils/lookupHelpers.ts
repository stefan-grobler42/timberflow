// Helper function to resolve lookup GUID to friendly name
export const resolveLookup = (guid: string | undefined | null, lookupArray: any[]): string => {
  if (!guid || !lookupArray || lookupArray.length === 0) {
    return '-';
  }
  
  const item = lookupArray.find(x => x.id === guid);
  return item ? item.name : '-';
};
