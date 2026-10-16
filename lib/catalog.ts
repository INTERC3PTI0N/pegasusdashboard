export type LessonType = 'video' | 'guide';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration: string; // "8 min" etc.
  summary: string;
  videoSrc?: string;
  guide?: { heading: string; body: string }[];
}

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  line: string;
  image: string;
  description: string;
  lessons: Lesson[];
}

const DEMO_VIDEO = '/videos/pega.mp4';

export const products: Product[] = [
  {
    slug: 'hard-rubber',
    name: 'Hard Rubber · Flexinite',
    tagline: 'The professional standard since 1961',
    line: 'Flexinite Series',
    image: '/images/pegasus_hard_rubber.jpg',
    description:
      'Master the legendary Flexinite hard rubber combs — heat-resistant, chemical-proof and precision-cut for professional salon work.',
    lessons: [
      {
        id: 'hr-01',
        title: 'Welcome to Flexinite',
        type: 'video',
        duration: '4 min',
        summary: 'An introduction to the hard rubber line, its history and what makes Flexinite unique.',
        videoSrc: DEMO_VIDEO,
      },
      {
        id: 'hr-02',
        title: 'Anatomy of a Hard Rubber Comb',
        type: 'guide',
        duration: '6 min read',
        summary: 'Understand tooth spacing, spine flexibility and edge finishing.',
        guide: [
          {
            heading: 'The Spine',
            body: 'Every Flexinite comb is cut from a single vulcanised rubber plate. The spine carries controlled flexibility — it bends with tension work and returns to true, which is why sectioning stays razor-straight even under heat.',
          },
          {
            heading: 'Tooth Geometry',
            body: 'Teeth are saw-cut, then hand-polished. Wide-set teeth detangle and distribute product; fine teeth build tension for precision cutting. The transition zone in combination combs is engineered so hair never snags when you cross over.',
          },
          {
            heading: 'Edge Finishing',
            body: 'The rounded tips glide along the scalp without scratching. Inspect your comb monthly: a chipped tooth should retire the comb from client work immediately.',
          },
        ],
      },
      {
        id: 'hr-03',
        title: 'Precision Sectioning Techniques',
        type: 'video',
        duration: '12 min',
        summary: 'Clean partings and consistent sections for cutting and colour work.',
        videoSrc: DEMO_VIDEO,
      },
      {
        id: 'hr-04',
        title: 'Barbering: Clipper-Over-Comb',
        type: 'video',
        duration: '15 min',
        summary: 'Using the Flexinite taper comb for seamless fades and blends.',
        videoSrc: DEMO_VIDEO,
      },
      {
        id: 'hr-05',
        title: 'Chemical Services & Heat Safety',
        type: 'guide',
        duration: '5 min read',
        summary: 'Why hard rubber wins around colour, relaxers and hot tools.',
        guide: [
          {
            heading: 'Chemical Resistance',
            body: 'Vulcanised rubber is inert to ammonia, peroxide and relaxer bases. Residue wipes clean without staining, so no colour transfer between clients — but always sanitise between services.',
          },
          {
            heading: 'Heat Behaviour',
            body: 'Flexinite tolerates blow-dryer and hot-iron proximity without warping up to 90°C. Never leave a comb resting on an active hot plate; even hard rubber has limits.',
          },
        ],
      },
      {
        id: 'hr-06',
        title: 'Care, Cleaning & Longevity',
        type: 'video',
        duration: '7 min',
        summary: 'Daily hygiene routine and long-term storage for a comb that lasts decades.',
        videoSrc: DEMO_VIDEO,
      },
    ],
  },
  {
    slug: 'cellulose',
    name: 'Cellulose Acetate',
    tagline: 'Hand-finished, plant-based luxury',
    line: 'Acetate Series',
    image: '/images/pegasus_cellulose.jpg',
    description:
      'Learn to work with our hand-polished cellulose acetate tools — the plant-based, hypoallergenic choice for sensitive scalps and premium finishing.',
    lessons: [
      {
        id: 'ca-01',
        title: 'The Acetate Story',
        type: 'video',
        duration: '5 min',
        summary: 'From cotton flake to hand-polished comb: how cellulose acetate is made.',
        videoSrc: DEMO_VIDEO,
      },
      {
        id: 'ca-02',
        title: 'Static Control & Sensitive Scalps',
        type: 'guide',
        duration: '4 min read',
        summary: 'Why acetate is naturally anti-static and hypoallergenic.',
        guide: [
          {
            heading: 'Anti-Static by Nature',
            body: 'Cellulose acetate holds a small amount of moisture within its structure, which dissipates static charge as you comb. Flyaways settle instead of lifting — ideal for fine hair and dry climates.',
          },
          {
            heading: 'Hypoallergenic Finishing',
            body: 'Each comb is diamond-polished, leaving no micro-burrs. Recommend acetate for clients with eczema, psoriasis or chemotherapy-sensitive scalps.',
          },
        ],
      },
      {
        id: 'ca-03',
        title: 'Blow-Dry Finishing with Acetate',
        type: 'video',
        duration: '11 min',
        summary: 'Glossy, static-free finishing techniques for editorial-level polish.',
        videoSrc: DEMO_VIDEO,
      },
      {
        id: 'ca-04',
        title: 'Detangling Wet Hair Safely',
        type: 'video',
        duration: '9 min',
        summary: 'Wide-tooth acetate technique that protects the cuticle when hair is weakest.',
        videoSrc: DEMO_VIDEO,
      },
      {
        id: 'ca-05',
        title: 'Polish & Restoration Guide',
        type: 'guide',
        duration: '6 min read',
        summary: 'Restore the deep gloss of an acetate comb after years of service.',
        guide: [
          {
            heading: 'Routine Care',
            body: 'Rinse in lukewarm water only — never hot. Dry immediately with a microfibre cloth. Acetate is plant-based and will slowly matte if left in water or alcohol-based sanitiser baths.',
          },
          {
            heading: 'Restoring the Gloss',
            body: 'A drop of chamois-applied polishing paste returns the mirror finish. Work along the comb, never across the teeth. If a comb whitens at the tips, it has absorbed moisture: retire it gracefully.',
          },
        ],
      },
    ],
  },
  {
    slug: 'ecowood',
    name: 'Ecowood · StaticBlock',
    tagline: 'Sustainable wood, zero static',
    line: 'Ecowood Series',
    image: '/images/pegasus_ecowood.jpg',
    description:
      'Technique and care for the Ecowood range — sustainably harvested wooden tools with StaticBlock treatment for scalp wellness and natural oils distribution.',
    lessons: [
      {
        id: 'ew-01',
        title: 'Ecowood & StaticBlock Explained',
        type: 'video',
        duration: '6 min',
        summary: 'The sustainable sourcing story and the science of the StaticBlock treatment.',
        videoSrc: DEMO_VIDEO,
      },
      {
        id: 'ew-02',
        title: 'Scalp Wellness Rituals',
        type: 'video',
        duration: '10 min',
        summary: 'Wooden-comb scalp massage sequences that boost circulation and relaxation.',
        videoSrc: DEMO_VIDEO,
      },
      {
        id: 'ew-03',
        title: 'Distributing Natural Oils',
        type: 'guide',
        duration: '5 min read',
        summary: 'The 100-stroke myth, revisited: what wood actually does for sebum distribution.',
        guide: [
          {
            heading: 'Why Wood Works',
            body: 'Wood is mildly porous, so it picks up sebum at the root and re-deposits it along the shaft as you comb. The result is natural conditioning, added shine and less need for silicone serums.',
          },
          {
            heading: 'Technique',
            body: 'Work in sections from nape to crown, root to tip, with slow strokes. Ten deliberate strokes per section outperforms a hundred careless ones. Finish with a cool blast to seal the cuticle.',
          },
        ],
      },
      {
        id: 'ew-04',
        title: 'Curly & Textured Hair with Ecowood',
        type: 'video',
        duration: '13 min',
        summary: 'Wide-tooth wooden comb technique for curl definition without frizz.',
        videoSrc: DEMO_VIDEO,
      },
      {
        id: 'ew-05',
        title: 'Caring for Wooden Tools',
        type: 'guide',
        duration: '4 min read',
        summary: 'Oiling, storage and what to never do to a wooden comb.',
        guide: [
          {
            heading: 'Monthly Oiling',
            body: 'A drop of jojoba or camellia oil rubbed in with a soft cloth keeps the wood nourished and the StaticBlock layer active. Let it absorb overnight before client use.',
          },
          {
            heading: 'The Never List',
            body: 'Never soak in water. Never use alcohol sanitiser sprays — use UV cabinet sanitisation instead. Never leave on a radiator or in direct sun; wood moves with heat and will bow.',
          },
        ],
      },
      {
        id: 'ew-06',
        title: 'Sustainability & The Pegasus Forest Programme',
        type: 'video',
        duration: '8 min',
        summary: 'Where the wood comes from and how each purchase replants.',
        videoSrc: DEMO_VIDEO,
      },
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getLesson(productSlug: string, lessonId: string) {
  const product = getProduct(productSlug);
  if (!product) return undefined;
  const index = product.lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return undefined;
  return { product, lesson: product.lessons[index], index };
}

