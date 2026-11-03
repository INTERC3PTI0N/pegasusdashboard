import Link from 'next/link';
import { Award, CalendarClock, Infinity as InfinityIcon, KeyRound, Lock, Sparkles } from 'lucide-react';
import { KITS, daysLeft, fmtDate, type Access } from '@/lib/kits';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/** The customer's two kits side by side: what each opens, how long it lasts, and what to do next. */
export function KitStatus({ access, essentialLessons, totalLessons }: { access: Access; essentialLessons: number; totalLessons: number }) {
  const ek = access.essentialKit;
  const left = ek?.expiresAt ? daysLeft(ek.expiresAt) : null;
  const total = ek?.expiresAt ? Math.max(1, daysLeft(ek.expiresAt, ek.registeredAt)) : 1;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Essential */}
      <Card className={cn('gap-3 py-5', access.essentialExpired && !access.mastery && 'border-destructive/40')}>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold" translate="no">{KITS.essential.name}</p>
            {access.mastery ? (
              <Badge variant="secondary">Included in Mastery</Badge>
            ) : ek && !access.essentialExpired ? (
              <Badge variant="success">Active</Badge>
            ) : ek ? (
              <Badge variant="destructive">Expired</Badge>
            ) : (
              <Badge variant="outline">Not registered</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Lessons 1–{essentialLessons} of {totalLessons} · 12 months of access
          </p>
          {!access.mastery && ek?.expiresAt && !access.essentialExpired && (
            <div className="space-y-1.5">
              <p className={cn('flex items-center gap-1.5 text-sm', left !== null && left <= 30 && 'font-medium text-destructive')}>
                <CalendarClock className="size-4" /> Access until {fmtDate(ek.expiresAt)} · {left} {left === 1 ? 'day' : 'days'} left
              </p>
              <Progress value={((left ?? 0) / total) * 100} className="h-1.5" aria-label="Access time remaining" />
            </div>
          )}
          {!access.mastery && access.essentialExpired && ek?.expiresAt && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <Lock className="size-4" /> Your access ended on {fmtDate(ek.expiresAt)}. Register a Mastery Kit for unlimited access,
              or another Essential Kit for 12 more months.
            </p>
          )}
          {access.mastery && <p className="text-sm text-muted-foreground">Your Mastery Kit includes every Essential Kit lesson.</p>}
        </CardContent>
      </Card>

      {/* Mastery */}
      <Card className={cn('gap-3 py-5', !access.mastery && 'border-primary/40 bg-primary/[0.03]')}>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold" translate="no">{KITS.mastery.name}</p>
            {access.mastery ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Not registered</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">All {totalLessons} lessons · unlimited access · certificate</p>
          {access.mastery ? (
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-1.5"><InfinityIcon className="size-4 text-primary" /> Unlimited access — no expiry</p>
              <p className="flex items-center gap-1.5"><Award className="size-4 text-primary" /> Certificate when you complete all {totalLessons} lessons</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="flex items-start gap-1.5 text-sm">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                Unlock the remaining {totalLessons - essentialLessons} lessons, keep access for life and earn the certificate.
              </p>
              <Button asChild size="sm">
                <Link href="/register-kit"><KeyRound /> Register a Mastery Kit</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Shown above locked content for customers without the Mastery Kit. */
export function UpgradeBanner({ lockedCount, className }: { lockedCount: number; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm', className)}>
      <Lock className="size-4 shrink-0 text-primary" />
      <p className="min-w-0 flex-1">
        <span className="font-medium">{lockedCount} {lockedCount === 1 ? 'lesson is' : 'lessons are'} part of the Mastery Kit.</span>{' '}
        Watch their previews below. Buy the Mastery Kit to get complete access.
      </p>
      <Button asChild size="sm" variant="outline">
        <Link href="/register-kit">Register Mastery Kit</Link>
      </Button>
    </div>
  );
}
