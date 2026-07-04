export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // demo only — plain text; use hashing in production
  salon: string;
  role: Role;
  /** Product slugs this customer has purchased. Content access is derived from this list only. */
  entitlements: string[];
}

/**
 * Demo customer records. In production this comes from your commerce
 * platform (Shopify/WooCommerce webhook, order database, etc.) — the
 * entitlements array is the single source of truth for content access.
 */
export const users: User[] = [
  {
    id: 'u-sofia',
    name: 'Sofia Laurent',
    email: 'sofia@atelier-laurent.com',
    password: 'pegasus',
    salon: 'Atelier Laurent, Paris',
    role: 'customer',
    entitlements: ['hard-rubber', 'cellulose'],
  },
  {
    id: 'u-marco',
    name: 'Marco Rossi',
    email: 'marco@studio-rossi.it',
    password: 'pegasus',
    salon: 'Studio Rossi, Milano',
    role: 'customer',
    entitlements: ['ecowood'],
  },
  {
    id: 'u-ava',
    name: 'Ava Chen',
    email: 'ava@chenhairlab.com',
    password: 'pegasus',
    salon: 'Chen Hair Lab, Singapore',
    role: 'customer',
    entitlements: ['hard-rubber', 'cellulose', 'ecowood'],
  },
  {
    id: 'u-admin',
    name: 'Elena Weiss',
    email: 'admin@pegasus.com',
    password: 'pegasus',
    salon: 'Pegasus Academy HQ',
    role: 'admin',
    entitlements: [],
  },
];

export function getCustomers(): User[] {
  return users.filter((u) => u.role === 'customer');
}

export function findUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}
