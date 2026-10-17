'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award, KeyRound, LogOut, Ban, CircleCheck, Trash2, CheckCircle2, Circle, RotateCcw, ExternalLink, StickyNote } from 'lucide-react';
import {
  updateCustomerProfile,
  resetCustomerPassword,
  setCustomerSuspended,
  signCustomerOutEverywhere,
  deleteCustomer,
  setCustomerProduct,
  overrideProgress,
  issueCertificateFor,
  revokeCertificateAction,
  reissueCertificateAction,
  addCustomerNote,
  deleteCustomerNote,
} from '../../actions';
import { useAction, ActionMessage } from '@/components/admin/action-feedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ── Profile ─────────────────────────────────────────────────────────────────

export function ProfileCard({
  id,
  profile,
}: {
  id: string;
  profile: { name: string; email: string; salon: string; phone: string; country: string };
}) {
  const { pending, result, run } = useAction();
  return (
    <Card className="gap-3 py-5">
      <CardContent>
        <form
          className="space-y-3"
          action={(fd) => run(() => updateCustomerProfile(id, fd))}
        >
          <p className="mono-tag text-[10px] text-muted-foreground">Profile</p>
          {(
            [
              ['name', 'Full name'],
              ['email', 'Email'],
              ['salon', 'Salon / studio'],
              ['phone', 'Phone'],
              ['country', 'Country'],
            ] as const
          ).map(([name, label]) => (
            <div key={name} className="space-y-1">
              <Label htmlFor={`p-${name}`} className="text-xs">{label}</Label>
              <Input id={`p-${name}`} name={name} defaultValue={profile[name]} type={name === 'email' ? 'email' : 'text'} />
            </div>
          ))}
          <Button size="sm" disabled={pending}>Save profile</Button>
          <ActionMessage result={result} />
        </form>
      </CardContent>
    </Card>
  );
}

// ── Account actions ─────────────────────────────────────────────────────────

export function AccountActions({ id, email, suspended }: { id: string; email: string; suspended: boolean }) {
  const { pending, result, run } = useAction();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState('');

  return (
    <Card className="gap-3 py-5">
      <CardContent className="space-y-3">
        <p className="mono-tag text-[10px] text-muted-foreground">Account</p>
        <div className="grid gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => confirm('Create a temporary password? Their current password stops working.') && run(() => resetCustomerPassword(id))}
          >
            <KeyRound /> Reset password
          </Button>
          <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => signCustomerOutEverywhere(id))}>
            <LogOut /> Sign out of all devices
          </Button>
          {suspended ? (
            <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => setCustomerSuspended(id, false))}>
              <CircleCheck /> Re-activate account
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              disabled={pending}
              onClick={() => confirm('Suspend this account? They are signed out and cannot sign in until re-activated.') && run(() => setCustomerSuspended(id, true))}
            >
              <Ban /> Suspend account
            </Button>
          )}
          {!confirmDelete ? (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Delete account…
            </Button>
          ) : (
            <div className="space-y-2 rounded-md border border-destructive/40 p-3">
              <p className="text-xs">
                Permanently deletes the account, progress, notes and certificates (their verification links stop
                working). Used keys stay spent. Type <b>{email}</b> to confirm.
              </p>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={email} />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" disabled={pending || typed.trim().toLowerCase() !== email} onClick={() => run(() => deleteCustomer(id, typed))}>
                  Delete permanently
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
        <ActionMessage result={result} />
      </CardContent>
    </Card>
  );
}

// ── Courses, lesson progress, certificates ──────────────────────────────────

interface CourseInfo {
  slug: string;
  name: string;
  image: string;
  lessons: { id: string; title: string; type: string }[];
  owned: boolean;
  completed: string[];
  lastActivity: string | null;
  certificate: { id: string; issuedAt: string } | null;
  hasRevoked: boolean;
}

export function CourseCard({ customerId, course }: { customerId: string; course: CourseInfo }) {
  const { pending, result, run } = useAction();
  const [open, setOpen] = useState(false);
  const done = new Set(course.completed);
  const count = course.lessons.filter((l) => done.has(l.id)).length;
  const percent = course.lessons.length ? Math.round((count / course.lessons.length) * 100) : 0;
  const toggle = (lessonId: string) => {
    const next = done.has(lessonId) ? course.completed.filter((x) => x !== lessonId) : [...course.completed, lessonId];
    run(() => overrideProgress(customerId, course.slug, next));
  };

  return (
    <div className="space-y-3 px-6 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{course.name}</p>
            {!course.owned && <Badge variant="outline">Not owned</Badge>}
            {course.certificate && (
              <Badge variant="success" className="gap-1"><Award className="size-3" /> Certified</Badge>
            )}
            {!course.certificate && course.hasRevoked && <Badge variant="destructive">Certificate revoked</Badge>}
          </div>
          {(course.owned || count > 0) && (
            <p className="text-xs text-muted-foreground">
              {count}/{course.lessons.length} lessons · last activity {fmt(course.lastActivity)}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant={course.owned ? 'ghost' : 'outline'}
          className={course.owned ? 'text-destructive' : ''}
          disabled={pending}
          onClick={() =>
            course.owned
              ? confirm(`Remove ${course.name} from this customer? Their progress is kept.`) && run(() => setCustomerProduct(customerId, course.slug, false))
              : run(() => setCustomerProduct(customerId, course.slug, true))
          }
        >
          {course.owned ? 'Remove access' : 'Grant access'}
        </Button>
      </div>

      {(course.owned || count > 0) && (
        <>
          <div className="flex items-center gap-3">
            <Progress value={percent} className="h-1.5" />
            <span className="w-10 text-right text-xs tabular-nums">{percent}%</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(!open)}>
              {open ? 'Hide lessons' : 'Lesson progress'}
            </Button>
            <Button size="sm" variant="outline" disabled={pending || count === course.lessons.length}
              onClick={() => confirm('Mark every lesson complete for this customer?') && run(() => overrideProgress(customerId, course.slug, 'complete'))}>
              <CheckCircle2 /> Mark all complete
            </Button>
            <Button size="sm" variant="outline" disabled={pending || count === 0}
              onClick={() => confirm('Reset this course’s progress to zero?') && run(() => overrideProgress(customerId, course.slug, 'reset'))}>
              <RotateCcw /> Reset progress
            </Button>
            {!course.certificate && (
              <Button size="sm" variant="outline" disabled={pending}
                onClick={() => confirm(`Issue a ${course.name} certificate now, regardless of progress?`) && run(() => issueCertificateFor(customerId, course.slug))}>
                <Award /> {course.hasRevoked ? 'Reissue certificate' : 'Issue certificate'}
              </Button>
            )}
          </div>
          {open && (
            <ul className="grid gap-1 rounded-md border p-2 sm:grid-cols-2">
              {course.lessons.map((l, i) => (
                <li key={l.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggle(l.id)}
                    className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-secondary/60"
                    title="Click to toggle"
                  >
                    {done.has(l.id) ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />}
                    <span><span className="mono-tag mr-1 text-[9px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>{l.title}</span>
                  </button>
                </li>
              ))}
              {course.lessons.length === 0 && <li className="p-2 text-xs text-muted-foreground">This course has no lessons yet.</li>}
            </ul>
          )}
        </>
      )}
      <ActionMessage result={result} />
    </div>
  );
}

export function CertificateRow({
  cert,
}: {
  cert: { id: string; productName: string; issuedAt: string; revokedAt: string | null; revokedReason: string | null; revokedBy: string | null };
}) {
  const { pending, result, run } = useAction();
  const [revoking, setRevoking] = useState(false);
  const [reason, setReason] = useState('');
  return (
    <div className="space-y-2 px-6 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <Award className={`size-4 shrink-0 ${cert.revokedAt ? 'text-muted-foreground' : 'text-primary'}`} />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight">
            {cert.productName} {cert.revokedAt && <Badge variant="destructive" className="ml-1">Revoked</Badge>}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono tracking-wider">{cert.id}</span> · issued {fmt(cert.issuedAt)}
            {cert.revokedAt && <> · revoked {fmt(cert.revokedAt)} by {cert.revokedBy}: “{cert.revokedReason}”</>}
          </p>
        </div>
        <Link href={`/verify/${cert.id}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          Verify <ExternalLink className="size-3.5" />
        </Link>
        {cert.revokedAt ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => reissueCertificateAction(cert.id))}>
            Reissue
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setRevoking(!revoking)}>
            Revoke…
          </Button>
        )}
      </div>
      {revoking && !cert.revokedAt && (
        <div className="flex flex-wrap gap-2 pl-7">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (shown on the verification page)" className="max-w-md" />
          <Button size="sm" variant="destructive" disabled={pending || !reason.trim()} onClick={() => run(() => revokeCertificateAction(cert.id, reason))}>
            Revoke certificate
          </Button>
        </div>
      )}
      <div className="pl-7"><ActionMessage result={result} /></div>
    </div>
  );
}

// ── Notes ───────────────────────────────────────────────────────────────────

export function NotesPanel({ customerId, notes }: { customerId: string; notes: { id: string; author: string; body: string; createdAt: string }[] }) {
  const { pending, result, run } = useAction();
  const [draft, setDraft] = useState('');
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base"><StickyNote className="size-4" /> Notes</CardTitle>
        <CardDescription>Internal — never shown to the customer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Call notes, follow-ups, special arrangements…"
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
        />
        <Button size="sm" disabled={pending || !draft.trim()} onClick={() => run(async () => { const r = await addCustomerNote(customerId, draft); if (r.ok) setDraft(''); return r; })}>
          Add note
        </Button>
        <ActionMessage result={result} />
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="group rounded-md border p-3 text-sm">
              <p className="whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{n.author} · {fmt(n.createdAt)}</span>
                <button
                  type="button"
                  className="opacity-0 hover:text-destructive group-hover:opacity-100"
                  onClick={() => confirm('Delete this note?') && run(() => deleteCustomerNote(customerId, n.id))}
                >
                  Delete
                </button>
              </p>
            </li>
          ))}
          {notes.length === 0 && <li className="text-xs text-muted-foreground">No notes yet.</li>}
        </ul>
      </CardContent>
    </Card>
  );
}
