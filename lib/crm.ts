export type CustomerStatus = 'lead' | 'active' | 'vip' | 'at-risk';

export interface CrmNote {
  id: string;
  author: string;
  date: string; // ISO
  body: string;
}

export interface CrmRecord {
  userId: string;
  status: CustomerStatus;
  phone: string;
  country: string;
  tags: string[];
  customerSince: string; // ISO
  lastContact: string; // ISO
  lifetimeValue: number; // EUR, demo figure
  notes: CrmNote[];
}

export const statusMeta: Record<CustomerStatus, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-secondary text-secondary-foreground' },
  active: { label: 'Active', className: 'bg-primary/10 text-accent-foreground' },
  vip: { label: 'VIP', className: 'bg-ink text-white' },
  'at-risk': { label: 'At risk', className: 'bg-destructive/10 text-destructive' },
};

/**
 * Demo CRM records — frontend only. In production this would come from
 * your CRM of record (HubSpot, Salesforce, a database…).
 */
export const crmRecords: CrmRecord[] = [
  {
    userId: 'u-sofia',
    status: 'vip',
    phone: '+33 1 42 68 53 00',
    country: 'France',
    tags: ['salon-owner', 'educator', 'repeat-buyer'],
    customerSince: '2023-04-12',
    lastContact: '2026-06-28',
    lifetimeValue: 2840,
    notes: [
      {
        id: 'n-s1',
        author: 'Elena Weiss',
        date: '2026-06-28',
        body: 'Interested in hosting a Flexinite masterclass at her Paris atelier this autumn. Send partnership deck.',
      },
      {
        id: 'n-s2',
        author: 'Elena Weiss',
        date: '2026-05-14',
        body: 'Ordered 12 cellulose combs for staff. Asked about bulk pricing tier — flagged to sales.',
      },
    ],
  },
  {
    userId: 'u-marco',
    status: 'at-risk',
    phone: '+39 02 8646 0201',
    country: 'Italy',
    tags: ['barber', 'single-product'],
    customerSince: '2025-11-03',
    lastContact: '2026-03-19',
    lifetimeValue: 180,
    notes: [
      {
        id: 'n-m1',
        author: 'Elena Weiss',
        date: '2026-03-19',
        body: 'Has not started the Ecowood course since purchase. Sent a nudge email with the scalp-ritual lesson highlighted.',
      },
    ],
  },
  {
    userId: 'u-ava',
    status: 'active',
    phone: '+65 6733 8933',
    country: 'Singapore',
    tags: ['salon-chain', 'full-collection', 'wholesale'],
    customerSince: '2024-01-27',
    lastContact: '2026-06-30',
    lifetimeValue: 6120,
    notes: [
      {
        id: 'n-a1',
        author: 'Elena Weiss',
        date: '2026-06-30',
        body: 'Rolling the academy out to all 4 branches. Wants team seats — good case study candidate once certified.',
      },
      {
        id: 'n-a2',
        author: 'Elena Weiss',
        date: '2026-04-02',
        body: 'Renewed wholesale agreement for 2026. Very happy with StaticBlock line.',
      },
    ],
  },
];

export function getCrmRecord(userId: string): CrmRecord | undefined {
  return crmRecords.find((r) => r.userId === userId);
}
