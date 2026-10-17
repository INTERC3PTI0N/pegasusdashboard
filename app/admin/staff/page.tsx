import { requireAdmin } from '@/lib/access';
import { getStaff } from '@/lib/users';
import { ROLE_LABELS, ROLE_PERMISSIONS, type AdminRole } from '@/lib/permissions';
import { relativeTime } from '@/lib/customer-rows';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StaffRow, AddStaffForm } from './staff-panels';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const me = await requireAdmin('staff');
  const staff = await getStaff();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">System</p>
        <h1 className="editorial-text text-4xl">Staff & roles</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Who can use the admin console, and what each person can manage. New staff get a temporary password and
          choose their own at first sign-in. Role changes apply from their next sign-in.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="gap-0 py-0">
          <CardContent className="divide-y p-0">
            {staff.map((s) => (
              <StaffRow
                key={s.id}
                isSelf={s.id === me.id}
                staff={{
                  id: s.id,
                  name: s.name,
                  email: s.email,
                  role: (s.adminRole ?? 'owner') as AdminRole,
                  suspended: !!s.suspendedAt,
                  pendingPassword: s.mustChangePassword,
                  lastSeen: relativeTime(s.lastSeenAt),
                }}
              />
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="self-start">
            <CardContent>
              <AddStaffForm />
            </CardContent>
          </Card>
          <Card className="gap-3 py-5">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">What each role can do</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(Object.keys(ROLE_LABELS) as AdminRole[]).map((r) => (
                <div key={r}>
                  <p className="font-medium">{ROLE_LABELS[r].label}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABELS[r].description}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/80">{ROLE_PERMISSIONS[r].join(' · ')}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
