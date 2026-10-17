import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { getProduct, courseUsage } from '@/lib/courses';
import { CourseEditor } from './course-editor';

export const dynamic = 'force-dynamic';

export default async function EditCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin('courses');
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const usage = await courseUsage(slug);
  const { slug: _slug, ...data } = product; // eslint-disable-line @typescript-eslint/no-unused-vars

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Courses
        </Link>
        <p className="mono-tag mt-4 text-[10px] text-primary">Course · /{slug}</p>
        <h1 className="editorial-text text-4xl">{product.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {usage.owners} customers own this course · {usage.keys} keys · {usage.certificates} certificates
        </p>
      </div>
      <CourseEditor slug={slug} initial={data} deletable={!usage.owners && !usage.keys && !usage.certificates} />
    </div>
  );
}
