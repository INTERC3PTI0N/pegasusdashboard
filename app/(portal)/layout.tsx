import { requireCustomer, accessFor } from '@/lib/access';
import { courseView } from '@/lib/course-view';
import { getProducts } from '@/lib/courses';
import { getAllProgress } from '@/lib/store';
import { logout } from '@/app/actions';
import { AppSidebar } from '@/components/portal/app-sidebar';
import { UserMenu } from '@/components/portal/user-menu';
import { MobileNav } from '@/components/portal/mobile-nav';
import { ContentGuard } from '@/components/portal/protected-content';
import { LanguageSwitcher } from '@/components/language-switcher';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomer();
  const products = await getProducts();
  const progress = await getAllProgress(user.id);

  const access = accessFor(user);
  const sidebarProducts = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    owned: access.anyKit,
    percent: access.anyKit ? courseView(p, access, progress[p.slug]).percent : 0,
  }));

  return (
    <div className="flex min-h-svh select-none [-webkit-touch-callout:none]">
      <ContentGuard />
      <AppSidebar products={sidebarProducts} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-8">
          <MobileNav products={sidebarProducts} />
          <div className="hidden md:block">
            <p className="mono-tag text-[10px] text-muted-foreground">Pegasus Masterclass</p>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <UserMenu name={user.name} email={user.email} salon={user.salon} onLogout={logout} />
          </div>
        </header>
        <main className="flex-1 px-4 py-8 md:px-8 lg:px-12">{children}</main>
      </div>
    </div>
  );
}
