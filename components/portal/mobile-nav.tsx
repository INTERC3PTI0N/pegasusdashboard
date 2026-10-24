'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, LayoutDashboard, Award, BookOpen, Lock, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProduct {
  slug: string;
  name: string;
  owned: boolean;
  percent: number;
}

export function MobileNav({ products }: { products: SidebarProduct[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </Button>
        <Link href="/dashboard">
          <Image
            src="/images/pegasus-logo.png"
            alt="Pegasus"
            width={96}
            height={45}
            className="h-9 w-auto"
          />
        </Link>
      </div>

      {/* Portal: the header's backdrop-blur would otherwise clip this fixed drawer to the header. */}
      {open && createPortal(
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-background border-t p-4 space-y-4 overflow-y-auto">
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
            <Link
              href="/certificates"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              <Award className="size-4" /> Certificates
            </Link>
            <Link
              href="/register-product"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              <KeyRound className="size-4" /> Register product
            </Link>
          </nav>
          <div>
            <p className="mono-tag px-3 pb-2 text-[10px] text-muted-foreground">My Products</p>
            {products.map((p) =>
              p.owned ? (
                <Link
                  key={p.slug}
                  href={`/products/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  <span className="flex items-center gap-2.5">
                    <BookOpen className="size-4" /> {p.name}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">{p.percent}%</span>
                </Link>
              ) : (
                <span
                  key={p.slug}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground/40'
                  )}
                >
                  <Lock className="size-4" /> {p.name}
                </span>
              )
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
