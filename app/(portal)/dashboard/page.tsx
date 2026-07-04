import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, CheckCircle2, Award, TrendingUp, ArrowRight, PlayCircle, ShieldAlert } from 'lucide-react';
import { requireUser } from '@/lib/access';
import { products, type Product } from '@/lib/catalog';
import { getAllProgress, getCertificates } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const progress = getAllProgress(user.id);
  const certificates = getCertificates(user.id);

  // Only products this customer purchased — everything else stays invisible.
  const owned: Product[] = products.filter((p) => user.entitlements.includes(p.slug));

  const stats = owned.map((p) => {
    const done = progress[p.slug]?.length ?? 0;
    return { product: p, done, total: p.lessons.length, percent: Math.round((done / p.lessons.length) * 100) };
  });

  const totalLessons = stats.reduce((s, x) => s + x.total, 0);
  const totalDone = stats.reduce((s, x) => s + x.done, 0);
  const overall = totalLessons ? Math.round((totalDone / totalLessons) * 100) : 0;

  // "Continue learning" = first incomplete lesson of the most-progressed unfinished course
  const inFlight = stats
    .filter((s) => s.percent < 100)
    .sort((a, b) => b.percent - a.percent)[0];
  const nextLesson = inFlight
    ? inFlight.product.lessons.find((l) => !(progress[inFlight.product.slug] ?? []).includes(l.id))
    : undefined;

  const firstName = user.name.split(' ')[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {denied && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <ShieldAlert className="size-4 shrink-0" />
          That content is reserved for purchasers of that product. It isn&apos;t part of your collection.
        </div>
      )}

      {/* Greeting */}
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">My Academy</p>
        <h1 className="editorial-text text-4xl md:text-5xl">Welcome back, {firstName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {user.salon} · {owned.length} registered {owned.length === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="gap-2 py-5">
          <CardHeader className="pb-0">
            <CardDescription>Products owned</CardDescription>
            <CardAction><BookOpen className="size-4 text-primary" /></CardAction>
            <CardTitle className="text-3xl tabular-nums">{owned.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">of {products.length} Pegasus lines</CardContent>
        </Card>
        <Card className="gap-2 py-5">
          <CardHeader className="pb-0">
            <CardDescription>Lessons completed</CardDescription>
            <CardAction><CheckCircle2 className="size-4 text-primary" /></CardAction>
            <CardTitle className="text-3xl tabular-nums">{totalDone}<span className="text-lg text-muted-foreground">/{totalLessons}</span></CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">across your collection</CardContent>
        </Card>
        <Card className="gap-2 py-5">
          <CardHeader className="pb-0">
            <CardDescription>Overall progress</CardDescription>
            <CardAction><TrendingUp className="size-4 text-primary" /></CardAction>
            <CardTitle className="text-3xl tabular-nums">{overall}%</CardTitle>
          </CardHeader>
          <CardContent><Progress value={overall} className="h-1.5" /></CardContent>
        </Card>
        <Card className="gap-2 py-5">
          <CardHeader className="pb-0">
            <CardDescription>Certificates earned</CardDescription>
            <CardAction><Award className="size-4 text-primary" /></CardAction>
            <CardTitle className="text-3xl tabular-nums">{certificates.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <Link href="/certificates" className="text-primary hover:underline">View certificates →</Link>
          </CardContent>
        </Card>
      </div>

      {/* Continue learning */}
      {nextLesson && inFlight && (
        <Card className="overflow-hidden py-0 gap-0">
          <div className="flex flex-col sm:flex-row">
            <div className="relative sm:w-56 h-36 sm:h-auto shrink-0">
              <Image src={inFlight.product.image} alt={inFlight.product.name} fill className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2 p-6">
              <p className="mono-tag text-[9px] text-primary">Continue learning</p>
              <h3 className="text-lg font-semibold leading-tight">{nextLesson.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {inFlight.product.name} · {nextLesson.duration}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <Button asChild size="sm">
                  <Link href={`/products/${inFlight.product.slug}/lessons/${nextLesson.id}`}>
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

      {/* Product library */}
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="editorial-text text-2xl">Your product library</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tutorials and guides unlocked by your purchases
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {stats.map(({ product, done, total, percent }) => (
            <Link key={product.slug} href={`/products/${product.slug}`} className="group">
              <Card className="h-full overflow-hidden py-0 gap-0 transition-all group-hover:shadow-lg group-hover:-translate-y-0.5">
                <div className="relative h-44">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <p className="mono-tag text-[9px] text-white/80">{product.line}</p>
                    {percent === 100 && <Badge className="bg-primary text-white">Completed</Badge>}
                  </div>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div>
                    <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.tagline}</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{done} of {total} lessons</span>
                      <span className="tabular-nums">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Open course <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {owned.length === 0 && (
          <Card className="py-12 text-center">
            <CardContent className="space-y-2">
              <p className="editorial-text text-2xl">No registered products yet</p>
              <p className="text-sm text-muted-foreground">
                Purchase a Pegasus tool and register it to unlock its academy content.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
