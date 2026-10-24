import defaults from './defaults.json';

/**
 * Editable content of the public Pegasus website (repo: Projects/Pegasus).
 * Each document is one block of the site; the admin editor is generated from these fields,
 * and saved data is sanitised against them. defaults.json holds the site's original copy.
 */

export type Field =
  | { name: string; label: string; type: 'text' | 'textarea' | 'longtext' | 'image' | 'video' | 'url'; help?: string }
  | { name: string; label: string; type: 'number'; help?: string }
  | { name: string; label: string; type: 'select'; options: { value: string; label: string }[]; help?: string }
  | { name: string; label: string; type: 'strings'; help?: string }
  | { name: string; label: string; type: 'list'; fields: Field[]; itemTitle: string; help?: string };

export interface DocDef {
  key: string;
  label: string;
  group: 'Site-wide' | 'Home page' | 'Collections';
  /** Where the block appears on the public site, for "View on site" / preview. */
  path: string;
  description: string;
  fields: Field[];
}

const t = (name: string, label: string, help?: string): Field => ({ name, label, type: 'text', help });
const ta = (name: string, label: string, help?: string): Field => ({ name, label, type: 'textarea', help });
const img = (name: string, label: string): Field => ({ name, label, type: 'image' });
const url = (name: string, label: string, help?: string): Field => ({ name, label, type: 'url', help });
const link = (): Field[] => [t('label', 'Label'), url('href', 'Link')];

// Shared shape of the alternating image/text rows (About, Technology, Sustainability).
const featureRow: Field[] = [
  t('kicker', 'Section label'),
  t('sub', 'Small subheading'),
  t('title', 'Heading'),
  ta('body', 'Body text'),
  img('image', 'Image'),
  t('ctaLabel', 'Button text'),
  url('ctaHref', 'Button link'),
];
const sectionHeading: Field[] = [t('kicker', 'Section label'), t('title', 'Heading'), ta('sub', 'Intro text')];

const collection: Field[] = [
  t('seoTitle', 'Page title (browser tab / Google)'),
  ta('seoDescription', 'Meta description (Google snippet)'),
  t('tag', 'Range tag'),
  t('title', 'Heading'),
  t('subtitle', 'Subheading'),
  img('heroImage', 'Hero image'),
  ta('intro', 'Intro statement'),
  { name: 'benefits', label: 'Benefits (tick list)', type: 'strings' },
  t('techName', 'Technology name'),
  t('techTagline', 'Technology tagline'),
  ta('techDesc', 'Technology description'),
  { name: 'features', label: 'Feature cards', type: 'list', itemTitle: 'title', fields: [t('title', 'Title'), ta('desc', 'Description')] },
];

export const docs: DocDef[] = [
  {
    key: 'global.seo', label: 'SEO & site title', group: 'Site-wide', path: '/',
    description: 'Browser tab title and Google description for the home page and fallback for all pages.',
    fields: [t('siteTitle', 'Site title'), ta('siteDescription', 'Meta description')],
  },
  {
    key: 'global.header', label: 'Header & menu', group: 'Site-wide', path: '/',
    description: 'Logo, main navigation, collections menu and the Online Shop button.',
    fields: [
      img('logo', 'Logo'),
      img('logoOnDark', 'Logo on dark backgrounds (header over the hero video)'),
      { name: 'navLinks', label: 'Main navigation', type: 'list', itemTitle: 'label', fields: link() },
      { name: 'collectionLinks', label: 'Collections menu (mobile)', type: 'list', itemTitle: 'label', fields: link() },
      t('shopLabel', 'Shop button text'),
      url('shopUrl', 'Shop button link'),
    ],
  },
  {
    key: 'global.footer', label: 'Footer', group: 'Site-wide', path: '/',
    description: 'Footer tagline, social links, link columns and legal line.',
    fields: [
      ta('tagline', 'Tagline'),
      url('instagramUrl', 'Instagram URL'),
      url('facebookUrl', 'Facebook URL'),
      url('youtubeUrl', 'YouTube URL'),
      {
        name: 'columns', label: 'Link columns', type: 'list', itemTitle: 'heading',
        fields: [t('heading', 'Column heading'), { name: 'links', label: 'Links', type: 'list', itemTitle: 'label', fields: link() }],
      },
      t('copyright', 'Copyright line', 'The year is added automatically.'),
      url('privacyUrl', 'Privacy policy link'),
      url('termsUrl', 'Terms link'),
    ],
  },
  {
    key: 'home.preloader', label: 'Loading screen', group: 'Home page', path: '/',
    description: 'The intro screen shown while the home page loads.',
    fields: [t('kicker', 'Top label'), ta('text', 'Bottom text'), img('image', 'Centre image')],
  },
  {
    key: 'home.hero', label: 'Hero video banner', group: 'Home page', path: '/#hero',
    description: 'Full-screen video banner at the top of the home page.',
    fields: [
      t('kicker', 'Small label'),
      t('titleLine1', 'Headline — line 1'),
      t('titleLine2', 'Headline — line 2'),
      ta('subtitle', 'Subtitle'),
      { name: 'video', label: 'Background video (MP4)', type: 'video' },
      img('poster', 'Poster image (shown while video loads)'),
      t('primaryCtaLabel', 'Primary button text'), url('primaryCtaHref', 'Primary button link'),
      t('secondaryCtaLabel', 'Secondary button text'), url('secondaryCtaHref', 'Secondary button link'),
    ],
  },
  { key: 'home.about', label: '01 · Heritage', group: 'Home page', path: '/#about', description: 'Image and story row about Presto Industries.', fields: featureRow },
  {
    key: 'home.products', label: '02 · Collections', group: 'Home page', path: '/#products',
    description: 'The three collection cards.',
    fields: [
      ...sectionHeading,
      t('cardCta', 'Card link text'),
      {
        name: 'items', label: 'Collection cards', type: 'list', itemTitle: 'title',
        fields: [t('n', 'Number'), t('title', 'Title'), t('sub', 'Technology line'), ta('blurb', 'Description'), img('image', 'Image'), url('href', 'Link')],
      },
    ],
  },
  { key: 'home.technology', label: '03 · Technology', group: 'Home page', path: '/#technology', description: 'Image and text row about the three technologies.', fields: featureRow },
  {
    key: 'home.philosophy', label: '04 · Philosophy', group: 'Home page', path: '/#philosophy',
    description: 'The large centred statement. The highlighted phrase is shown in the accent colour.',
    fields: [t('kicker', 'Section label'), ta('statementBefore', 'Statement — before highlight'), t('highlight', 'Highlighted phrase'), ta('statementAfter', 'Statement — after highlight'), ta('body', 'Supporting text')],
  },
  { key: 'home.sustainability', label: '05 · Sustainability', group: 'Home page', path: '/#sustainability', description: 'Image and text row about Ecowood.', fields: featureRow },
  {
    key: 'home.journal', label: '06 · Journal (blog)', group: 'Home page', path: '/#journal',
    description: 'Section heading and the journal articles.',
    fields: [
      ...sectionHeading,
      {
        name: 'articles', label: 'Articles', type: 'list', itemTitle: 'title',
        fields: [
          t('title', 'Title'),
          {
            name: 'category', label: 'Category', type: 'select',
            options: [{ value: 'technology', label: 'Technology' }, { value: 'history', label: 'History' }, { value: 'trichology', label: 'Trichology' }],
          },
          t('readTime', 'Read time'),
          t('date', 'Date / byline'),
          ta('summary', 'Summary'),
          { name: 'content', label: 'Article text', type: 'longtext', help: 'Blank line = new paragraph. Start a line with #### for a subheading.' },
          img('image', 'Image'),
          t('author', 'Author'),
          t('authorRole', 'Author role'),
        ],
      },
    ],
  },
  {
    key: 'home.whoWeServe', label: '07 · Who we serve', group: 'Home page', path: '/#who-we-serve',
    description: 'Audience icons row.',
    fields: [
      ...sectionHeading,
      {
        name: 'items', label: 'Audiences', type: 'list', itemTitle: 'label',
        fields: [
          t('label', 'Label'),
          {
            name: 'icon', label: 'Icon', type: 'select',
            options: [
              { value: 'truck', label: 'Truck' }, { value: 'ship', label: 'Ship' }, { value: 'building', label: 'Building' },
              { value: 'cart', label: 'Shopping cart' }, { value: 'store', label: 'Store' }, { value: 'scissors', label: 'Scissors' },
              { value: 'users', label: 'People' }, { value: 'globe', label: 'Globe' }, { value: 'sparkles', label: 'Sparkles' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'home.brochure', label: '08 · Brochure request', group: 'Home page', path: '/#brochure',
    description: 'Brochure section heading and the catalogue card. Submissions arrive in Admin → Enquiries.',
    fields: [
      ...sectionHeading,
      t('cardKicker', 'Card label'), t('cardTitle', 'Card title'), ta('cardText', 'Card text'), img('cardImage', 'Card image'),
      t('stat1Value', 'Stat 1 value'), t('stat1Label', 'Stat 1 label'), t('stat2Value', 'Stat 2 value'), t('stat2Label', 'Stat 2 label'),
    ],
  },
  {
    key: 'home.contact', label: '09 · Contact & locations', group: 'Home page', path: '/#contact',
    description: 'Contact heading, enquiry form text and the office locations on the map. Submissions arrive in Admin → Enquiries.',
    fields: [
      ...sectionHeading,
      ta('dealerText', 'Dealer enquiry intro'),
      ta('businessText', 'Business enquiry intro'),
      t('defaultLocation', 'Location selected by default (its ID)'),
      {
        name: 'locations', label: 'Office locations', type: 'list', itemTitle: 'name',
        fields: [
          t('id', 'ID (lowercase, no spaces)'), t('name', 'City'), t('role', 'Office role'), ta('address', 'Address'),
          t('phone', 'Phone'), t('email', 'Email'), ta('details', 'Details'),
          { name: 'mapX', label: 'Map position — across (0–100)', type: 'number' },
          { name: 'mapY', label: 'Map position — down (0–100)', type: 'number' },
        ],
      },
    ],
  },
  { key: 'collection.hard-rubber', label: 'Hard Rubber', group: 'Collections', path: '/collections/hard-rubber', description: 'The Hard Rubber · Flexinite collection page.', fields: collection },
  { key: 'collection.cellulose', label: 'Cellulose Acetate', group: 'Collections', path: '/collections/cellulose', description: 'The Cellulose Acetate collection page.', fields: collection },
  { key: 'collection.ecowood', label: 'Ecowood', group: 'Collections', path: '/collections/ecowood', description: 'The Ecowood · StaticBlock collection page.', fields: collection },
];

export type Content = Record<string, unknown>;
export const siteDefaults = defaults as Record<string, Content>;

export function getDocDef(key: string): DocDef | undefined {
  return docs.find((d) => d.key === key);
}

// ── Sanitising (the editor is a trust boundary: only known fields, safe values) ──

const MAX_TEXT = 20_000;
const MAX_ITEMS = 200;
// Links/media the public site will render: site-relative, anchors, http(s), mail and phone.
const SAFE_URL = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;

function cleanUrl(v: unknown): string {
  const s = String(v ?? '').trim().slice(0, 2000);
  return s === '' || SAFE_URL.test(s) ? s : '';
}

export function sanitize(fields: Field[], data: unknown): Content {
  const src = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const out: Content = {};
  for (const f of fields) {
    const v = src[f.name];
    switch (f.type) {
      case 'url':
      case 'image':
      case 'video':
        out[f.name] = cleanUrl(v);
        break;
      case 'number': {
        const n = Number(v);
        out[f.name] = Number.isFinite(n) ? n : 0;
        break;
      }
      case 'select':
        out[f.name] = f.options.some((o) => o.value === v) ? v : f.options[0].value;
        break;
      case 'strings':
        out[f.name] = (Array.isArray(v) ? v : [])
          .map((s) => String(s ?? '').trim().slice(0, MAX_TEXT))
          .filter(Boolean)
          .slice(0, MAX_ITEMS);
        break;
      case 'list':
        out[f.name] = (Array.isArray(v) ? v : []).slice(0, MAX_ITEMS).map((item) => sanitize(f.fields, item));
        break;
      default:
        out[f.name] = String(v ?? '').slice(0, MAX_TEXT);
    }
  }
  return out;
}
