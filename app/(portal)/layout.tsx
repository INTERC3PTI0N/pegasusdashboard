import { requireCustomer } from '@/lib/access';
import { products } from '@/lib/catalog';
import { getAllProgress } from '@/lib/store';
import { logout } from '@/app/actions';
import { AppSidebar } from '@/components/portal/app-sidebar';
import { UserMenu } from '@/components/portal/user-menu';
import { MobileNav } from '@/components/portal/mobile-nav';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomer();
  const progress = await getAllProgress(user.id);

  const sidebarProducts = products.map((p) => {
    const owned = user.entitlements.includes(p.slug);
    const done = progress[p.slug]?.length ?? 0;
    return {
      slug: p.slug,
      name: p.name,
      owned,
      percent: owned ? Math.round((done / p.lessons.length) * 100) : 0,
    };
  });

  return (
    <div className="flex min-h-svh">
      <AppSidebar products={sidebarProducts} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-8">
          <MobileNav products={sidebarProducts} />
          <div className="hidden md:block">
            <p className="mono-tag text-[10px] text-muted-foreground">Pegasus Academy</p>
          </div>
          <UserMenu name={user.name} email={user.email} salon={user.salon} onLogout={logout} />
        </header>
        <main className="flex-1 px-4 py-8 md:px-8 lg:px-12">{children}</main>
        <footer className="border-t px-4 md:px-8 py-4">
          <p className="mono-tag text-[9px] text-muted-foreground/60">
            Pegasus Hair Tools — Infinite Styling · Content exclusive to verified product owners
          </p>
        </footer>
      </div>
    </div>
  );
}
