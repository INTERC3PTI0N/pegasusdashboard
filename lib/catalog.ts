import type { LessonTier } from './kits';

export type LessonType = 'video' | 'guide';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration: string; // "8 min" etc.
  summary: string;
  /** Which kit opens this lesson: 'essential' (Essential + Mastery) or 'mastery' (Mastery only). */
  tier: LessonTier;
  /**
   * A file bundled in /media (e.g. "/media/pega.mp4") or an upload from the media library ("/cms-media/<id>").
   * Never public: served only to customers whose kit opens the lesson, via /api/media/[slug]/[lessonId].
   */
  videoFile?: string;
  /** Optional short teaser shown to customers whose kit doesn't open the lesson yet. */
  previewFile?: string;
  guide?: { heading: string; body: string }[];
}

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  line: string;
  /** Card, thumbnail and video cover (16:9, 1920×1080). */
  image: string;
  /** Optional course-page header (4:1, 2400×600), shown whole; falls back to `image`. */
  banner?: string;
  description: string;
  lessons: Lesson[];
}

const DEMO_VIDEO = '/media/pega.mp4'; // placeholder video bundled in /media (not public)

const LINE = 'The Andrea Bozzano Technique';
const DESCRIPTION =
  'Follow complete haircuts step by step, with Andrea Bozzano and the PEGASUS® combs he uses throughout the lessons.';

const LESSONS: [string, string][] = [
  ['LESSON 1 - SOFT LAYERS', "Women's cut, medium length, medium hair, combs used: 501 and 211"],
  ['LESSON 2 - LONG BOB', "Women's cut, medium-short length (shoulder-length), medium and mixed hair, combs used: 201 and 406"],
  ['LESSON 3 - SHAG CUT', "Women's cut, medium-long length, thick hair, comb used: 123"],
  ['LESSON 4 - MAN TAPER', "Men's cut, short length, all hair types, comb used: 302"],
  ['LESSON 5 - VOLUME LAYERS', "Women's cut, medium-long length, fine and fragile hair, combs used: 202 and 609"],
  ['LESSON 6 - LONG LAYERS', "Women's cut, long length, any hair type, combs used: 141 and 101"],
  ['LESSON 7 - CURLY LAYERS', "Women's cut, curly hair, combs used: 502 and 501"],
  ['LESSON 8 - CLASSIC BARBER', "Men's cut, short length, medium hair, combs used: 514A and 615"],
  ['LESSON 9 - SKIN FADE', "Men's cut, very short length, all hair types, comb used: 518A"],
  ['LESSON 10 - OLD MONEY LENGTH', "Men's cut, medium-long length, thick and medium hair, combs used: B1 and B2"],
];

const lesson = (i: number): Lesson => ({
  id: `module-${String(i + 1).padStart(2, '0')}`,
  title: LESSONS[i][0],
  type: 'video',
  duration: '',
  summary: LESSONS[i][1],
  tier: i < 4 ? 'essential' : 'mastery',
  videoFile: DEMO_VIDEO,
});

/**
 * Andrea Bozzano's technique as two courses: the Essential Course (lessons 1–4, Essential + Mastery Kits)
 * and the Masterclass (lessons 5–10, Mastery Kit only; Essential holders see previews). The certificate is
 * claimed on the Masterclass once every lesson of both is complete. Seeds the `courses` table on first
 * use; after that courses are edited in Admin → Courses and read via lib/courses.ts.
 */
export const seedProducts: Product[] = [
  {
    slug: 'essential',
    name: 'Essential Course',
    tagline: 'Lessons 1–4 · Essential Kit',
    line: LINE,
    image: '/images/course-card.jpg',
    banner: '/images/course-banner.webp',
    description: DESCRIPTION,
    lessons: [0, 1, 2, 3].map(lesson),
  },
  {
    slug: 'masterclass',
    name: 'Masterclass',
    tagline: 'Lessons 5–10 · Mastery Kit',
    line: LINE,
    image: '/images/course-card.jpg',
    banner: '/images/course-banner.webp',
    description: DESCRIPTION,
    lessons: [4, 5, 6, 7, 8, 9].map(lesson),
  },
];
