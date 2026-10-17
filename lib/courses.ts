import 'server-only';
import { cache } from 'react';
import { db } from './db';
import { seedProducts, type Product } from './catalog';

type CourseData = Omit<Product, 'slug'>;
interface Row {
  slug: string;
  data: CourseData;
  position: number;
}

/** The course catalogue (one query per request). Seeds the table from lib/catalog.ts on first use. */
export const getProducts = cache(async (): Promise<Product[]> => {
  let rows = await db()<Row[]>`select slug, data, position from courses order by position, slug`;
  if (rows.length === 0) {
    for (const [i, { slug, ...data }] of seedProducts.entries()) {
      await db()`
        insert into courses (slug, data, position) values (${slug}, ${db().json(data as never)}, ${i})
        on conflict (slug) do nothing`;
    }
    rows = await db()<Row[]>`select slug, data, position from courses order by position, slug`;
  }
  return rows.map((r) => ({ ...r.data, slug: r.slug }));
});

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}

export async function getLesson(productSlug: string, lessonId: string) {
  const product = await getProduct(productSlug);
  if (!product) return undefined;
  const index = product.lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return undefined;
  return { product, lesson: product.lessons[index], index };
}

// ── Admin editing ───────────────────────────────────────────────────────────

export async function saveCourse(slug: string, data: CourseData, actor: string) {
  await db()`
    update courses set data = ${db().json(data as never)}, updated_at = now(), updated_by = ${actor}
    where slug = ${slug}`;
}

/** Returns false if the slug is taken. */
export async function createCourse(slug: string, name: string, actor: string): Promise<boolean> {
  const data: CourseData = {
    name,
    tagline: '',
    line: '',
    image: '/images/pegasus_luxury_salon.jpg',
    description: '',
    lessons: [],
  };
  const rows = await db()`
    insert into courses (slug, data, position, updated_by)
    values (${slug}, ${db().json(data as never)}, (select coalesce(max(position), -1) + 1 from courses), ${actor})
    on conflict (slug) do nothing
    returning slug`;
  return rows.length === 1;
}

export async function moveCourse(slug: string, direction: -1 | 1) {
  const list = await db()<{ slug: string }[]>`select slug from courses order by position, slug`;
  const i = list.findIndex((r) => r.slug === slug);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db().begin(async (tx) => {
    for (const [pos, r] of list.entries()) await tx`update courses set position = ${pos} where slug = ${r.slug}`;
  });
}

/** How many customers / keys / certificates reference a course (blocks deletion when > 0). */
export async function courseUsage(slug: string) {
  const [r] = await db()<{ owners: number; keys: number; certificates: number }[]>`
    select
      (select count(*)::int from users where ${slug}::text = any(entitlements)) as owners,
      (select count(*)::int from product_keys where product_slug = ${slug}) as keys,
      (select count(*)::int from certificates where product_slug = ${slug}) as certificates`;
  return r;
}

export async function deleteCourse(slug: string) {
  await db()`delete from courses where slug = ${slug}`;
  await db()`delete from progress where product_slug = ${slug}`;
}
