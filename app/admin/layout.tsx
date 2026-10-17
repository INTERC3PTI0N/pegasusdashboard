import { requireAdmin } from '@/lib/access';
import { logout } from '@/app/actions';
import { AdminSidebar, AdminMobileNav } from '@/components/admin/admin-sidebar';
import { UserMenu } from '@/components/portal/user-menu';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/permissions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-svh">
      <AdminSidebar role={admin.adminRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-8">
          <div className="flex items-center gap-3">
            <AdminMobileNav role={admin.adminRole} />
            <p className="mono-tag hidden text-[10px] text-muted-foreground sm:block">Pegasus Academy</p>
            <Badge variant="outline" className="mono-tag text-[9px] border-primary/40 text-primary">
              Admin Console
            </Badge>
          </div>
          <UserMenu name={admin.name} email={admin.email} salon={ROLE_LABELS[admin.adminRole ?? 'owner'].label} onLogout={logout} admin />
        </header>
        <main className="flex-1 px-4 py-8 md:px-8 lg:px-12">{children}</main>
        <footer className="border-t px-4 md:px-8 py-4">
          <p className="mono-tag text-[9px] text-muted-foreground/60">
            Pegasus Hair Tools — Internal · Customer &amp; academy administration
          </p>
        </footer>
      </div>
    </div>
  );
}
