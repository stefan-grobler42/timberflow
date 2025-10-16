import { useState, useEffect } from 'react';
import { employeeService } from '../services/millenniumServices';
import { accountService, d365OrderService, d365ContactService } from '../services/d365Services';
import type { Employee, Account, D365Order, D365Contact } from '../types/millennium';

interface LookupData {
  employees: Map<string, string>;
  customers: Map<string, string>;
  salesOrders: Map<string, string>;
  contacts: Map<string, string>;
  loading: boolean;
}

export function useLookupData(): LookupData {
  const [lookupData, setLookupData] = useState<LookupData>({
    employees: new Map(),
    customers: new Map(),
    salesOrders: new Map(),
    contacts: new Map(),
    loading: true,
  });

  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const [employees, customers, salesOrders, contacts] = await Promise.all([
          employeeService.getAll().catch(() => [] as Employee[]),
          accountService.getAll().catch(() => [] as Account[]),
          d365OrderService.getAll().catch(() => [] as D365Order[]),
          d365ContactService.getAll().catch(() => [] as D365Contact[]),
        ]);

        const employeeMap = new Map<string, string>(
          employees
            .filter((e: Employee) => e.id)
            .map((e: Employee) => [e.id.toLowerCase(), e.name || 'Unknown Employee'])
        );

        const customerMap = new Map<string, string>(
          customers
            .filter((c: Account) => c.id)
            .map((c: Account) => [c.id.toLowerCase(), c.name || 'Unknown Customer'])
        );

        const salesOrderMap = new Map<string, string>(
          salesOrders
            .filter((o: D365Order) => o.id)
            .map((o: D365Order) => [o.id.toLowerCase(), o.orderNumber || o.name || 'Unknown Order'])
        );

        const contactMap = new Map<string, string>(
          contacts
            .filter((c: D365Contact) => c.id)
            .map((c: D365Contact) => [c.id.toLowerCase(), c.fullName || `${c.firstName} ${c.lastName}`.trim() || 'Unknown Contact'])
        );

        setLookupData({
          employees: employeeMap,
          customers: customerMap,
          salesOrders: salesOrderMap,
          contacts: contactMap,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to load lookup data:', error);
        setLookupData((prev) => ({ ...prev, loading: false }));
      }
    };

    loadLookupData();
  }, []);

  return lookupData;
}

export function resolveLookup(
  guid: string | null | undefined,
  lookupMap: Map<string, string>
): string {
  if (!guid) return '-';
  const name = lookupMap.get(guid.toLowerCase());
  return name || guid.substring(0, 8) + '...';
}
