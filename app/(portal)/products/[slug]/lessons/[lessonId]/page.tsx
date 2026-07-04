import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, PlayCircle, FileText, CheckCircle2, Circle } from 'lucide-react';
import { requireProductAccess } from '@/lib/access';
import { getLesson } from '@/lib/catalog';
import { getCompletedLessons } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { MarkCompleteButton } from './mark-complete';

export const dynamic = 'force-dynamic';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  // Entitlement gate — lesson content only exists for this product's purchasers.
  const { user, product } = await requireProductAccess(slug);

  const found = getLesson(slug, lessonId);
  if (!found) notFound();
  const { lesson, index } = found;

  const done = new Set(getCompletedLessons(user.id, product.slug));
  const isDone = done.has(lesson.id);
  const percent = Math.round((done.size / product.lessons.length) * 100);

  const prev = product.lessons[index - 1];
  const next = product.lessons[index + 1];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          <div>
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" /> {product.name}
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="gap-1.5">
                {lesson.type === 'video' ? (
                  <><PlayCircle className="size-3" /> Video lesson</>
                ) : (
                  <><FileText className="size-3" /> Written guide</>
                )}
              </Badge>
              <span className="text-xs text-muted-foreground">{lesson.duration}</span>
              {isDone && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="size-3" /> Completed
                </Badge>
              )}
            </div>
            <h1 className="editorial-text mt-3 text-3xl md:text-4xl">{lesson.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{lesson.summary}</p>
          </div>

          {/* Content */}
          {lesson.type === 'video' && lesson.videoSrc ? (
            <Card className="overflow-hidden py-0">
              <video
                key={lesson.id}
                src={lesson.videoSrc}
                controls
                playsInline
                className="aspect-video w-full bg-ink"
                poster={product.image}
              />
            </Card>
          ) : (
            <Card>
              <CardContent className="space-y-8 py-2">
                {lesson.guide?.map((section) => (
                  <section key={section.heading}>
                    <h2 className="editorial-text text-2xl mb-2">{section.heading}</h2>
                    <p className="text-[15px] leading-relaxed text-foreground/85">{section.body}</p>
                  </section>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completion + prev/next */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <MarkCompleteButton
              productSlug={product.slug}
              lessonId={lesson.id}
              initialComplete={isDone}
            />
            <div className="flex gap-2">
              {prev && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/products/${product.slug}/lessons/${prev.id}`}>
                    <ArrowLeft /> Previous
                  </Link>
                </Button>
              )}
              {next && (
                <Button asChild size="sm">
                  <Link href={`/products/${product.slug}/lessons/${next.id}`}>
                    Next lesson <ArrowRight />
                  </Link>
                </Button>
              )}
              {!next && (
                <Button asChild variant="ink" size="sm">
                  <Link href={`/products/${product.slug}`}>Finish course →</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — course outline */}
        <aside className="space-y-4">
          <Card className="py-5 gap-3">
            <CardContent className="space-y-3">
              <p className="mono-tag text-[10px] text-muted-foreground">Course progress</p>
              <div className="flex items-center gap-3">
                <Progress value={percent} className="h-2" />
                <span className="text-sm tabular-nums font-medium">{percent}%</span>
              </div>
              <Separator />
              <ol className="space-y-1">
                {product.lessons.map((l, i) => {
                  const active = l.id === lesson.id;
                  const lDone = done.has(l.id);
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/products/${product.slug}/lessons/${l.id}`}
                        className={`flex items-start gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                          active
                            ? 'bg-secondary font-medium'
                            : 'text-muted-foreground hover:bg-secondary/60'
                        }`}
                      >
                        {lDone ? (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        ) : (
                          <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <span className="leading-snug">
                          <span className="mono-tag mr-1.5 text-[9px] text-muted-foreground/60">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {l.title}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
