'use client';

import { UserPlus, KeyRound, Ban, CircleCheck, Trash2 } from 'lucide-react';
import { addStaffAction, setStaffRoleAction, resetStaffPassword, setStaffSuspended, removeStaff } from '../actions';
import { useAction, ActionMessage } from '@/components/admin/action-feedback';
import { ROLE_LABELS, type AdminRole } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLES = Object.keys(ROLE_LABELS) as AdminRole[];

export function StaffRow({
  staff,
  isSelf,
}: {
  staff: { id: string; name: string; email: string; role: AdminRole; suspended: boolean; pendingPassword: boolean; lastSeen: string };
  isSelf: boolean;
}) {
  const { pending, result, run } = useAction();
  return (
    <div className="space-y-2 px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {staff.name}
            {isSelf && <Badge variant="outline">You</Badge>}
            {staff.suspended && <Badge variant="destructive">Suspended</Badge>}
            {staff.pendingPassword && <Badge variant="outline">Awaiting first sign-in</Badge>}
          </p>
          <p className="text-xs text-muted-foreground">{staff.email} · last seen {staff.lastSeen}</p>
        </div>
        <select
          aria-label={`Role for ${staff.name}`}
          value={staff.role}
          disabled={pending || isSelf}
          onChange={(e) => run(() => setStaffRoleAction(staff.id, e.target.value as AdminRole))}
          className="h-8 rounded-md border bg-transparent px-2 text-sm"
          title={isSelf ? 'Ask another owner to change your role' : undefined}
        >
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r].label}</option>)}
        </select>
      </div>
      {!isSelf && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={pending}
            onClick={() => confirm(`Create a temporary password for ${staff.name}?`) && run(() => resetStaffPassword(staff.id))}>
            <KeyRound /> Reset password
          </Button>
          {staff.suspended ? (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setStaffSuspended(staff.id, false))}>
              <CircleCheck /> Re-activate
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={pending}
              onClick={() => confirm(`Suspend ${staff.name}? They are signed out immediately.`) && run(() => setStaffSuspended(staff.id, true))}>
              <Ban /> Suspend
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-destructive" disabled={pending}
            onClick={() => confirm(`Delete ${staff.name}'s admin account permanently?`) && run(() => removeStaff(staff.id))}>
            <Trash2 /> Remove
          </Button>
        </div>
      )}
      <ActionMessage result={result} />
    </div>
  );
}

export function AddStaffForm() {
  const { pending, result, run } = useAction();
  return (
    <form className="space-y-3" action={(fd) => run(() => addStaffAction(fd))}>
      <p className="font-medium">Add staff member</p>
      <div className="space-y-1">
        <Label htmlFor="s-name">Name</Label>
        <Input id="s-name" name="name" required maxLength={100} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="s-email">Work email</Label>
        <Input id="s-email" name="email" type="email" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="s-role">Role</Label>
        <select id="s-role" name="role" defaultValue="support" className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r].label} — {ROLE_LABELS[r].description}</option>)}
        </select>
      </div>
      <Button disabled={pending}><UserPlus /> Add staff member</Button>
      <ActionMessage result={result} />
    </form>
  );
}
