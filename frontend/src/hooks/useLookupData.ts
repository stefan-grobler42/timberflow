import { useState, useEffect } from 'react';
import { employeeService } from '../services/millenniumServices';
import { accountService, d365OrderService } from '../services/d365Services';
import type { Employee, Account, D365Order } from '../types/millennium';

interface LookupData {
  employees: Map<string, string>;
  customers: Map<string, string>;
  salesOrders: Map<string, string>;
  loading: boolean;
}

export function useLookupData(): LookupData {
  const [lookupData, setLookupData] = useState<LookupData>({
    employees: new Map(),
    customers: new Map(),
    salesOrders: new Map(),
    loading: true,
  });

  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const [employees, customers, salesOrders] = await Promise.all([
          employeeService.getAll().catch(() => [] as Employee[]),
          accountService.getAll().catch(() => [] as Account[]),
          d365OrderService.getAll().catch(() => [] as D365Order[]),
        ]);

        const employeeMap = new Map<string, string>(
          employees
            .filter((e: Employee) => e.cr694_driversid)
            .map((e: Employee) => [e.cr694_driversid.toLowerCase(), e.cr694_name || 'Unknown Employee'])
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

        setLookupData({
          employees: employeeMap,
          customers: customerMap,
          salesOrders: salesOrderMap,
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
