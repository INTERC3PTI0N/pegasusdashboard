/** Staff roles and what each may manage. Shared by server checks and the admin sidebar. */

export type AdminRole = 'owner' | 'editor' | 'support';

export type Permission =
  | 'customers' // view/edit customers, progress overrides, notes
  | 'keys'
  | 'certificates'
  | 'courses'
  | 'site' // website content + media library
  | 'enquiries'
  | 'staff' // add/remove admins, change roles
  | 'audit';

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  owner: ['customers', 'keys', 'certificates', 'courses', 'site', 'enquiries', 'staff', 'audit'],
  editor: ['courses', 'site', 'enquiries'],
  support: ['customers', 'keys', 'certificates', 'enquiries'],
};

export const ROLE_LABELS: Record<AdminRole, { label: string; description: string }> = {
  owner: { label: 'Owner', description: 'Everything, including staff accounts and the audit log.' },
  editor: { label: 'Editor', description: 'Website content, media, courses and enquiries.' },
  support: { label: 'Support', description: 'Customers, product keys, certificates and enquiries.' },
};

export function can(role: AdminRole | null | undefined, permission: Permission): boolean {
  return !!role && ROLE_PERMISSIONS[role].includes(permission);
}
