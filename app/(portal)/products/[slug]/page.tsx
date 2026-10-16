import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle, FileText, CheckCircle2, Circle, Award, ArrowLeft } from 'lucide-react';
import { requireProductAccess } from '@/lib/access';
import { getCompletedLessons, findCertificateFor } from '@/lib/store';
import { generateCertificate } from '@/app/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { slug } = await params;
  const { welcome } = await searchParams;
  // Server-side entitlement gate: non-purchasers are redirected before any content renders.
  const { user, product } = await requireProductAccess(slug);

  const done = new Set(await getCompletedLessons(user.id, product.slug));
  const percent = Math.round((done.size / product.lessons.length) * 100);
  const complete = percent === 100;
  const certificate = await findCertificateFor(user.id, product.slug);

  const videoCount = product.lessons.filter((l) => l.type === 'video').length;
  const guideCount = product.lessons.length - videoCount;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      {welcome && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <CheckCircle2 className="size-4 shrink-0 text-primary" />
          Product registered — {product.name} is now unlocked. Complete every lesson to earn your certificate.
        </div>
      )}

      {/* Hero */}
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
              <strong className="text-foreground">{videoCount}</strong> video lessons
            </span>
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">{guideCount}</strong> written guides
            </span>
            <div className="flex items-center gap-2 min-w-44 flex-1 max-w-72">
              <Progress value={percent} className="h-2" />
              <span className="text-sm tabular-nums text-muted-foreground">{percent}%</span>
            </div>
            {complete && (
              certificate ? (
                <Button asChild variant="ink" size="sm">
                  <Link href={`/certificates/${certificate.id}`}>
                    <Award /> View certificate
                  </Link>
                </Button>
              ) : (
                <form action={generateCertificate.bind(null, product.slug)}>
                  <Button type="submit" variant="ink" size="sm">
                    <Award /> Claim your certificate
                  </Button>
                </form>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Curriculum */}
      <div>
        <h2 className="editorial-text text-2xl mb-4">Curriculum</h2>
        <div className="space-y-2.5">
          {product.lessons.map((lesson, i) => {
            const isDone = done.has(lesson.id);
            return (
              <Link
                key={lesson.id}
                href={`/products/${product.slug}/lessons/${lesson.id}`}
                className="group block"
              >
                <Card className="py-0 transition-all group-hover:border-primary/40 group-hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <span className="mono-tag w-7 text-center text-[10px] text-muted-foreground">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="size-5 shrink-0 text-primary" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-muted-foreground/40" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight group-hover:text-primary transition-colors">
                        {lesson.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{lesson.summary}</p>
                    </div>
                    <Badge variant="secondary" className="hidden sm:inline-flex gap-1.5">
                      {lesson.type === 'video' ? (
                        <><PlayCircle className="size-3" /> Video</>
                      ) : (
                        <><FileText className="size-3" /> Guide</>
                      )}
                    </Badge>
                    <span className="hidden sm:block w-20 text-right text-xs text-muted-foreground">
                      {lesson.duration}
                    </span>
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
