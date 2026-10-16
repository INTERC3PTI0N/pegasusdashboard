'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Award, LifeBuoy, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/customers', label: 'Customers', icon: Users, exact: false },
  { href: '/admin/certificates', label: 'Certificates', icon: Award, exact: false },
  { href: '/admin/keys', label: 'Product keys', icon: KeyRound, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar min-h-svh sticky top-0 h-svh">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/images/pegasus-logo.png"
            alt="Pegasus"
            width={120}
            height={32}
            className="h-7 w-auto"
            priority
          />
          <span className="mono-tag text-[9px] text-primary mt-1">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mono-tag px-2 pb-2 text-[10px] text-muted-foreground">Manage</p>
        <ul className="space-y-0.5">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
