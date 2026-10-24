'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Award, LifeBuoy, KeyRound, PanelsTopLeft, Images, Inbox, ScrollText, GraduationCap, ShieldCheck, Menu, X } from 'lucide-react';
import { can, type AdminRole, type Permission } from '@/lib/permissions';
import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: typeof Users; exact?: boolean; permission?: Permission };

const sections: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Academy',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/admin/customers', label: 'Customers', icon: Users, permission: 'customers' },
      { href: '/admin/courses', label: 'Courses', icon: GraduationCap, permission: 'courses' },
      { href: '/admin/certificates', label: 'Certificates', icon: Award, permission: 'certificates' },
      { href: '/admin/keys', label: 'Product keys', icon: KeyRound, permission: 'keys' },
    ],
  },
  {
    heading: 'Website',
    items: [
      { href: '/admin/site', label: 'Site content', icon: PanelsTopLeft, permission: 'site' },
      { href: '/admin/media', label: 'Media library', icon: Images, permission: 'site' },
      { href: '/admin/enquiries', label: 'Enquiries', icon: Inbox, permission: 'enquiries' },
    ],
  },
  {
    heading: 'System',
    items: [
      { href: '/admin/staff', label: 'Staff & roles', icon: ShieldCheck, permission: 'staff' },
      { href: '/admin/audit', label: 'Audit log', icon: ScrollText, permission: 'audit' },
    ],
  },
];

function visibleSections(role: AdminRole | null) {
  return sections
    .map((section) => ({ ...section, items: section.items.filter((i) => !i.permission || can(role, i.permission)) }))
    .filter((section) => section.items.length > 0);
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Below md the sidebar is hidden; this drawer carries the same (permission-filtered) links. */
export function AdminMobileNav({ role }: { role: AdminRole | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button type="button" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} className="rounded-md p-2 hover:bg-secondary">
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {/* Portal: the header's backdrop-blur would otherwise clip this fixed drawer to the header. */}
      {open && createPortal(
        <nav className="fixed inset-x-0 bottom-0 top-16 z-40 space-y-5 overflow-y-auto border-t bg-background p-4">
          {visibleSections(role).map((section) => (
            <div key={section.heading}>
              <p className="mono-tag px-3 pb-1 text-[10px] text-muted-foreground">{section.heading}</p>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium',
                    isActive(pathname, item) ? 'bg-secondary' : 'hover:bg-secondary'
                  )}
                >
                  <item.icon className="size-4" /> {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>,
        document.body
      )}
    </div>
  );
}

export function AdminSidebar({ role }: { role: AdminRole | null }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar min-h-svh sticky top-0 h-svh">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/images/pegasus-logo.png"
            alt="Pegasus"
            width={120}
            height={56}
            className="h-10 w-auto"
            priority
          />
          <span className="mono-tag text-[9px] text-primary mt-1">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {visibleSections(role).map((section) => (
          <div key={section.heading}>
            <p className="mono-tag px-2 pb-2 text-[10px] text-muted-foreground">{section.heading}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <a
          href="mailto:it@pegasus.com"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LifeBuoy className="size-4" />
          Internal support
        </a>
        <p className="mono-tag mt-3 px-2.5 text-[9px] text-muted-foreground/60">
          Engineering since 1961
        </p>
      </div>
    </aside>
  );
}
