import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { getProducts } from '@/lib/courses';
import { getAnalytics } from '@/lib/analytics';
import { Card, CardContent } from '@/components/ui/card';
import { CourseOrder, NewCourseForm } from './course-list';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  await requireAdmin('courses');
  const [products, { funnel }] = await Promise.all([getProducts(), getAnalytics(30)]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">Academy</p>
        <h1 className="editorial-text text-4xl">Courses</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each course belongs to a product and is unlocked by that product&apos;s keys. Edit lessons, videos and
          written guides here — changes are live for customers as soon as you save.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="gap-0 py-0">
          <CardContent className="divide-y p-0">
            {products.map((p, i) => {
              const f = funnel.find((x) => x.slug === p.slug);
              const videos = p.lessons.filter((l) => l.type === 'video').length;
              return (
                <div key={p.slug} className="flex items-center gap-4 px-5 py-4">
                  <CourseOrder slug={p.slug} first={i === 0} last={i === products.length - 1} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="size-14 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.lessons.length} lessons ({videos} video, {p.lessons.length - videos} guide) · {f?.owners ?? 0} owners ·{' '}
                      {f?.certified ?? 0} certified · <span className="font-mono">/{p.slug}</span>
                    </p>
                  </div>
                  <Link href={`/admin/courses/${p.slug}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    Edit <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardContent>
            <NewCourseForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
