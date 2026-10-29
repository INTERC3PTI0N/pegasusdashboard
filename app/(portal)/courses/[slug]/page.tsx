import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle, FileText, CheckCircle2, Circle, Award, ArrowLeft, Lock, Eye } from 'lucide-react';
import { requireCourse } from '@/lib/access';
import { getAllProgress, findCertificateFor, hasRevokedCertificate } from '@/lib/store';
import { getProducts } from '@/lib/courses';
import { courseView, awardsCertificate, programmeProgress } from '@/lib/course-view';
import { KITS } from '@/lib/kits';
import { generateCertificate } from '@/app/actions';
import { UpgradeBanner } from '@/components/portal/kit-status';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Server-side kit gate: customers without a kit are redirected before any content renders.
  const { user, product, access } = await requireCourse(slug);

  const [products, progress] = await Promise.all([getProducts(), getAllProgress(user.id)]);
  const c = courseView(product, access, progress[product.slug]);
  // One certificate, claimed on the Masterclass once every lesson of both courses is complete.
  const certCourse = awardsCertificate(product);
  const programme = programmeProgress(products, progress);
  const certificate = await findCertificateFor(user.id, product.slug);
  const revoked = !certificate && (await hasRevokedCertificate(user.id, product.slug));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <Card className="overflow-hidden py-0 gap-0">
        <div className="relative h-52 md:h-64">
          <Image src={product.image} alt={product.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="mono-tag text-[10px] text-white/75 mb-2">{product.line}</p>
            <h1 className="editorial-text text-3xl md:text-4xl">{product.name}</h1>
          </div>
        </div>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground max-w-2xl">{product.description}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">{c.open}</strong> of {c.total} lessons unlocked
              {access.mastery ? ` · ${KITS.mastery.name}` : access.essential ? ` · ${KITS.essential.name}` : ''}
            </span>
            <div className="flex items-center gap-2 min-w-44 flex-1 max-w-72">
              <Progress value={c.percent} className="h-2" />
              <span className="text-sm tabular-nums text-muted-foreground">{c.percent}%</span>
            </div>
            {certCourse && access.mastery && programme.complete && (
              certificate ? (
                <Button asChild variant="ink" size="sm">
                  <Link href={`/certificates/${certificate.id}`}><Award /> View certificate</Link>
                </Button>
              ) : revoked ? (
                <span className="text-sm text-destructive">Certificate revoked — contact support</span>
              ) : (
                <form action={generateCertificate.bind(null, product.slug)}>
                  <Button type="submit" variant="ink" size="sm"><Award /> Claim your certificate</Button>
                </form>
              )
            )}
          </div>
          {certCourse && !programme.complete && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Award className="size-3.5" /> Complete all {programme.total} lessons of the Essential Course and the Masterclass to earn
              your PEGASUS® Academy certificate{access.mastery ? ` (${programme.done}/${programme.total} done)` : ` — included with the ${KITS.mastery.name}`}.
            </p>
          )}
        </CardContent>
      </Card>

      {c.locked > 0 && <UpgradeBanner lockedCount={c.locked} />}
      {access.essentialExpired && !access.mastery && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Your {KITS.essential.name} access has ended. Register a kit to continue.
        </p>
      )}

      <div>
        <h2 className="editorial-text text-2xl mb-4">Lessons</h2>
        <div className="space-y-2.5">
          {product.lessons.map((lesson) => {
            const open = c.canOpen(lesson.tier);
            const isDone = c.isDone(lesson.id);
            return (
              <Link key={lesson.id} href={`/courses/${product.slug}/lessons/${lesson.id}`} className="group block">
                <Card className={`py-0 transition-all group-hover:border-primary/40 group-hover:shadow-md ${open ? '' : 'bg-muted/30'}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {!open ? (
                      <Lock className="size-5 shrink-0 text-muted-foreground" />
                    ) : isDone ? (
                      <CheckCircle2 className="size-5 shrink-0 text-primary" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-muted-foreground/40" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium leading-tight transition-colors group-hover:text-primary ${open ? '' : 'text-muted-foreground'}`}>
                        {lesson.title}
                      </p>
                      {lesson.summary && <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{lesson.summary}</p>}
                    </div>
                    {!open ? (
                      <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
                        <Eye className="size-3" /> Preview
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="hidden sm:inline-flex gap-1.5">
                        {lesson.type === 'video' ? <><PlayCircle className="size-3" /> Video</> : <><FileText className="size-3" /> Guide</>}
                      </Badge>
                    )}
                    <span className="hidden sm:block w-16 text-right text-xs text-muted-foreground">{lesson.duration}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
