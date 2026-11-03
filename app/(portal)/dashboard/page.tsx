import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Award, TrendingUp, ArrowRight, PlayCircle, ShieldAlert, PartyPopper, KeyRound, Lock } from 'lucide-react';
import { requireCustomer, accessFor } from '@/lib/access';
import { getProducts } from '@/lib/courses';
import { getAllProgress, getCertificates } from '@/lib/store';
import { courseView } from '@/lib/course-view';
import { KITS, fmtDate, isKitId } from '@/lib/kits';
import { KitStatus } from '@/components/portal/kit-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; registered?: string; password?: string }>;
}) {
  const user = await requireCustomer();
  const { denied, registered, password } = await searchParams;
  const [products, progress, allCerts] = await Promise.all([getProducts(), getAllProgress(user.id), getCertificates(user.id)]);
  // Active certificates for courses that still exist (older certificates stay verifiable, but aren't this course's).
  const certificates = allCerts.filter((c) => !c.revokedAt && products.some((p) => p.slug === c.productSlug));
  const access = accessFor(user);

  const courses = access.anyKit ? products.map((p) => courseView(p, access, progress[p.slug])) : [];
  const openTotal = courses.reduce((s, c) => s + c.open, 0);
  const doneTotal = courses.reduce((s, c) => s + c.done, 0);
  const overall = openTotal ? Math.round((doneTotal / openTotal) * 100) : 0;
  const inFlight = courses.filter((c) => c.next).sort((a, b) => b.percent - a.percent)[0];
  const lessonsTotal = products.reduce((s, p) => s + p.lessons.length, 0);
  const essentialTotal = products.reduce((s, p) => s + p.lessons.filter((l) => l.tier === 'essential').length, 0);
  const firstName = user.name.split(' ')[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {denied && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <ShieldAlert className="size-4 shrink-0" />
          That content isn&apos;t included in your kit.
        </div>
      )}
      {isKitId(registered) && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm" role="status">
          <PartyPopper className="size-4 shrink-0 text-primary" />
          {registered === 'mastery'
            ? 'Mastery Kit registered — every lesson is unlocked, with unlimited access and the certificate on completion.'
            : `Essential Kit registered — lessons 1–${essentialTotal} are unlocked${
                access.essentialKit?.expiresAt ? ` until ${fmtDate(access.essentialKit.expiresAt)}` : ''
              }.`}
        </div>
      )}
      {password === 'changed' && (
        <p className="rounded-lg border px-4 py-3 text-sm" role="status">Password changed. Other devices have been signed out.</p>
      )}

      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">My Masterclass</p>
        <h1 className="editorial-text text-4xl md:text-5xl">Welcome back, {firstName}</h1>
        {user.salon && <p className="mt-2 text-sm text-muted-foreground">{user.salon}</p>}
      </div>

      {!access.anyKit ? (
        <Card className="py-12 text-center">
          <CardContent className="mx-auto max-w-lg space-y-3">
            <KeyRound className="mx-auto size-8 text-primary" />
            <p className="editorial-text text-2xl">Register your Kit</p>
            <p className="text-sm text-muted-foreground">
              Enter the code from your PEGASUS® kit. The {KITS.essential.name} opens the first {essentialTotal} lessons for 12
              months; the {KITS.mastery.name} opens all {lessonsTotal}, with unlimited access and the certificate.
            </p>
            <Button asChild className="mt-2">
              <Link href="/register-kit">Register your Kit</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="editorial-text text-2xl">My kits</h2>
            <KitStatus access={access} essentialLessons={essentialTotal} totalLessons={lessonsTotal} />
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="gap-2 py-5">
              <CardHeader className="pb-0">
                <CardDescription>Lessons completed</CardDescription>
                <CardAction><CheckCircle2 className="size-4 text-primary" /></CardAction>
                <CardTitle className="text-3xl tabular-nums">
                  {doneTotal}<span className="text-lg text-muted-foreground">/{openTotal}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">of the lessons your kit opens</CardContent>
            </Card>
            <Card className="gap-2 py-5">
              <CardHeader className="pb-0">
                <CardDescription>Progress</CardDescription>
                <CardAction><TrendingUp className="size-4 text-primary" /></CardAction>
                <CardTitle className="text-3xl tabular-nums">{overall}%</CardTitle>
              </CardHeader>
              <CardContent><Progress value={overall} className="h-1.5" /></CardContent>
            </Card>
            <Card className="gap-2 py-5">
              <CardHeader className="pb-0">
                <CardDescription>Certificate</CardDescription>
                <CardAction><Award className="size-4 text-primary" /></CardAction>
                <CardTitle className="text-xl">
                  {certificates.length ? 'Earned' : access.mastery ? 'In progress' : 'Mastery Kit only'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <Link href="/certificates" className="text-primary hover:underline">View certificates →</Link>
              </CardContent>
            </Card>
          </div>

          {inFlight?.next && (
            <Card className="overflow-hidden py-0 gap-0">
              <div className="flex flex-col sm:flex-row">
                <div className="relative sm:w-56 h-36 sm:h-auto shrink-0">
                  <Image src={inFlight.product.image} alt={inFlight.product.name} fill className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col justify-center gap-2 p-6">
                  <p className="mono-tag text-[9px] text-primary">Continue learning</p>
                  <h3 className="text-lg font-semibold leading-tight">{inFlight.next.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {inFlight.product.name}{inFlight.next.duration && ` · ${inFlight.next.duration}`}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <Button asChild size="sm">
                      <Link href={`/courses/${inFlight.product.slug}/lessons/${inFlight.next.id}`}>
                        <PlayCircle /> Resume
                      </Link>
                    </Button>
                    <div className="flex items-center gap-2 flex-1 max-w-48">
                      <Progress value={inFlight.percent} className="h-1.5" />
                      <span className="text-xs tabular-nums text-muted-foreground">{inFlight.percent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <section>
            <h2 className="editorial-text mb-4 text-2xl">My course</h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((c) => (
                <Link key={c.product.slug} href={`/courses/${c.product.slug}`} className="group">
                  <Card className="h-full overflow-hidden py-0 gap-0 transition-all group-hover:shadow-lg group-hover:-translate-y-0.5">
                    <div className="relative aspect-video">
                      <Image src={c.product.image} alt={c.product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <p className="mono-tag text-[9px] text-white/80">{c.product.line}</p>
                        {c.complete && <Badge className="bg-primary text-white">Completed</Badge>}
                      </div>
                    </div>
                    <CardContent className="p-5 space-y-3">
                      <div>
                        <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">{c.product.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.product.tagline}</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{c.done} of {c.open} lessons</span>
                          <span className="tabular-nums">{c.percent}%</span>
                        </div>
                        <Progress value={c.percent} className="h-1.5" />
                        {c.locked > 0 && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="size-3" /> {c.locked} more with the Mastery Kit
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        Open course <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
