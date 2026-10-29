import type { Product } from './catalog';
import { canOpenLesson, type Access } from './kits';

/** A course as one customer sees it: what their kit opens, what they've done, what's next. */
export function courseView(product: Product, access: Access, completed: string[] = []) {
  const done = new Set(completed);
  const open = product.lessons.filter((l) => canOpenLesson(access, l.tier));
  const openDone = open.filter((l) => done.has(l.id)).length;
  return {
    product,
    total: product.lessons.length,
    open: open.length,
    locked: product.lessons.length - open.length,
    essentialCount: product.lessons.filter((l) => l.tier === 'essential').length,
    /** Progress over the modules this customer can open. */
    done: openDone,
    percent: open.length ? Math.round((openDone / open.length) * 100) : 0,
    /** Every lesson of the course finished — the certificate condition (Mastery only). */
    complete: product.lessons.length > 0 && product.lessons.every((l) => done.has(l.id)),
    next: open.find((l) => !done.has(l.id)),
    isDone: (id: string) => done.has(id),
    canOpen: (tier: Product['lessons'][number]['tier']) => canOpenLesson(access, tier),
  };
}

/** The course the certificate is claimed on: the one with Mastery lessons (the Masterclass). */
export const awardsCertificate = (product: Product) => product.lessons.some((l) => (l.tier ?? 'mastery') === 'mastery');

/** The certificate condition: every lesson of every course (Essential Course + Masterclass) complete. */
export function programmeProgress(products: Product[], progress: Record<string, string[]>) {
  const total = products.reduce((s, p) => s + p.lessons.length, 0);
  const done = products.reduce((s, p) => s + p.lessons.filter((l) => progress[p.slug]?.includes(l.id)).length, 0);
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0, complete: total > 0 && done === total };
}
