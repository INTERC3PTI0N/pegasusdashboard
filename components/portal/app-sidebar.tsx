'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Award, BookOpen, LifeBuoy, Lock, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SidebarProduct {
  slug: string;
  name: string;
  owned: boolean;
  percent: number;
}

export function AppSidebar({ products }: { products: SidebarProduct[] }) {
  const pathname = usePathname();

  const mainNav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/certificates', label: 'Certificates', icon: Award },
    { href: '/register-product', label: 'Register product', icon: KeyRound },
  ];

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar min-h-svh sticky top-0 h-svh">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/images/pegasus-logo.png"
            alt="Pegasus"
            width={120}
            height={56}
            className="h-10 w-auto"
            priority
          />
          <span className="mono-tag text-[9px] text-primary mt-1">Academy</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="mono-tag px-2 pb-2 text-[10px] text-muted-foreground">Overview</p>
          <ul className="space-y-0.5">
            {mainNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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

        <div>
          <p className="mono-tag px-2 pb-2 text-[10px] text-muted-foreground">My Products</p>
          <ul className="space-y-0.5">
            {products.map((p) => {
              const href = `/products/${p.slug}`;
              const active = pathname.startsWith(href);
              return (
                <li key={p.slug}>
                  {p.owned ? (
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <BookOpen className="size-4 shrink-0" />
                        <span className="truncate">{p.name}</span>
                      </span>
                      {p.percent === 100 ? (
                        <Badge variant="success" className="text-[10px] px-1.5">✓</Badge>
                      ) : (
                        <span className="text-[10px] tabular-nums text-muted-foreground">{p.percent}%</span>
                      )}
                    </Link>
                  ) : (
                    <span
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground/40 cursor-not-allowed select-none"
                      title="Register this product with its key to unlock"
                    >
                      <Lock className="size-4 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="border-t p-4">
        <a
          href="mailto:academy@pegasus.com"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LifeBuoy className="size-4" />
          Support
        </a>
        <p className="mono-tag mt-3 px-2.5 text-[9px] text-muted-foreground/60">
          Engineering since 1961
        </p>
      </div>
    </aside>
  );
}
