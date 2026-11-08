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
  group: 'Site-wide' | 'Home page' | 'Pages' | 'Products';
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

// Shared shape of the alternating image/text rows (Flexinite®, Masterclass).
const featureRow: Field[] = [
  t('kicker', 'Section label'),
  t('sub', 'Small subheading'),
  t('title', 'Heading'),
  ta('body', 'Body text'),
  img('image', 'Image'),
  t('ctaLabel', 'Button text'),
  url('ctaHref', 'Button link'),
];
const seo: Field[] = [t('seoTitle', 'Page title (browser tab / Google)'), ta('seoDescription', 'Meta description (Google snippet)')];

// The six comb functions and five hair-type tags (ids are fixed — they drive the product filters).
const FUNCTIONS = [
  { value: '', label: '— Not set —' },
  { value: 'detangle', label: 'Detangle & Prep' },
  { value: 'cut', label: 'Cut & Section' },
  { value: 'colour', label: 'Colour & Foil' },
  { value: 'barber', label: 'Barbering & Fade' },
  { value: 'finish', label: 'Finish & Style' },
  { value: 'carry', label: 'Carry & Care' },
];

export const docs: DocDef[] = [
  {
    key: 'global.seo', label: 'SEO & site title', group: 'Site-wide', path: '/',
    description: 'Browser tab title and Google description for the home page and fallback for all pages.',
    fields: [t('siteTitle', 'Site title'), ta('siteDescription', 'Meta description')],
  },
  {
    key: 'global.header', label: 'Header & menu', group: 'Site-wide', path: '/',
    description: 'Logo, main navigation and the header button.',
    fields: [
      img('logo', 'Logo'),
      img('logoOnDark', 'Logo on dark backgrounds (header over the hero video)'),
      { name: 'navLinks', label: 'Main navigation', type: 'list', itemTitle: 'label', fields: link() },
      t('shopLabel', 'Header button text'),
      url('shopUrl', 'Header button link'),
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
  {
    key: 'home.intro', label: '01 · Brand statement', group: 'Home page', path: '/#intro',
    description: 'The brand statement and talk points under the hero.',
    fields: [t('kicker', 'Section label'), ta('statement', 'Statement'), { name: 'talkPoints', label: 'Talk points', type: 'strings' }],
  },
  {
    key: 'home.functions', label: '02 · Find the right comb', group: 'Home page', path: '/#functions',
    description: 'Heading for the six comb functions (the functions themselves are edited under Products).',
    fields: [...[t('kicker', 'Section label'), t('title', 'Heading'), ta('sub', 'Intro text')], t('ctaLabel', 'Button text')],
  },
  { key: 'home.technology', label: '03 · Flexinite®', group: 'Home page', path: '/#technology', description: 'Image and text row about Flexinite®.', fields: featureRow },
  { key: 'home.masterclass', label: '04 · Masterclass', group: 'Home page', path: '/#masterclass', description: 'Image and text row about the Masterclass and kits.', fields: featureRow },
  {
    key: 'home.whoWeServe', label: '05 · Who we serve', group: 'Home page', path: '/#who-we-serve',
    description: 'Audience icons row.',
    fields: [
      t('kicker', 'Section label'), t('title', 'Heading'), ta('sub', 'Intro text'),
      {
        name: 'items', label: 'Audiences', type: 'list', itemTitle: 'label',
        fields: [
          t('label', 'Label'),
          {
            name: 'icon', label: 'Icon', type: 'select',
            options: [
              { value: 'scissors', label: 'Scissors' }, { value: 'razor', label: 'Razor' }, { value: 'store', label: 'Store' },
              { value: 'graduation', label: 'Graduation cap' }, { value: 'truck', label: 'Truck' }, { value: 'briefcase', label: 'Briefcase' },
              { value: 'users', label: 'People' }, { value: 'globe', label: 'Globe' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'home.enquiry', label: '06 · Enquiry call to action', group: 'Home page', path: '/#enquiry',
    description: 'The "Connect with us" band at the end of the home page.',
    fields: [t('kicker', 'Section label'), t('title', 'Heading'), ta('text', 'Text'), t('email', 'Email address'), t('ctaLabel', 'Button text'), url('ctaHref', 'Button link')],
  },
  {
    key: 'about.page', label: 'About Us', group: 'Pages', path: '/about',
    description: 'Brand belief, brand statement and the "Our story" timeline.',
    fields: [
      ...seo, t('kicker', 'Section label'), t('title', 'Heading'), img('image', 'Image'),
      { name: 'belief', label: 'Brand belief', type: 'longtext', help: 'Blank line = new paragraph.' },
      t('statementTitle', 'Brand statement heading'), ta('statement', 'Brand statement'),
      t('timelineTitle', 'Timeline heading'),
      { name: 'timeline', label: 'Timeline', type: 'list', itemTitle: 'year', fields: [t('year', 'Year'), ta('text', 'Text')] },
    ],
  },
  {
    key: 'flexinite.page', label: 'Flexinite® Technology', group: 'Pages', path: '/flexinite',
    description: 'The Flexinite® Q&A — the house standard explanation (Brand Guidelines, section 6).',
    fields: [
      ...seo, t('kicker', 'Section label'), t('title', 'Heading'), ta('intro', 'Intro line'), img('image', 'Image'),
      { name: 'qa', label: 'Questions & answers', type: 'list', itemTitle: 'q', fields: [t('q', 'Question'), ta('a', 'Answer')] },
    ],
  },
  {
    key: 'contact.page', label: 'Contact', group: 'Pages', path: '/contact',
    description: 'Contact page: office details and the enquiry form text. Submissions arrive in Admin → Enquiries.',
    fields: [
      ...seo, t('kicker', 'Section label'), t('title', 'Heading'), ta('sub', 'Intro text'),
      t('officeName', 'Office name'), t('officeRole', 'Office role'), ta('address', 'Address'), t('phone', 'Phone'), t('email', 'Email'),
      ta('dealerText', 'Trade enquiry intro'), ta('businessText', 'Salon / education enquiry intro'),
    ],
  },
  {
    key: 'products.catalogue', label: 'Combs, functions & hair types', group: 'Products', path: '/products',
    description: 'Every PEGASUS® comb with its function and hair-type tags, plus the function and hair-type descriptions.',
    fields: [
      ...seo, t('kicker', 'Section label'), t('title', 'Heading'), ta('intro', 'Intro text'),
      { name: 'advantages', label: 'Advantage cards', type: 'list', itemTitle: 'title', fields: [t('title', 'Title'), ta('text', 'Text')] },
      t('enquiryLabel', 'Enquiry button text (product page)'),
      {
        name: 'functions', label: 'Functions', type: 'list', itemTitle: 'name',
        help: 'Keep the IDs (detangle, cut, colour, barber, finish, carry) — combs refer to them.',
        fields: [t('id', 'ID'), t('name', 'Name'), ta('purpose', 'Purpose')],
      },
      {
        name: 'hairTypes', label: 'Hair types', type: 'list', itemTitle: 'name',
        help: 'Keep the IDs (fine, medium, thick, curly, all) — combs refer to them.',
        fields: [t('id', 'ID'), t('name', 'Name'), ta('desc', 'Description')],
      },
      {
        name: 'products', label: 'Combs', type: 'list', itemTitle: 'model',
        fields: [
          t('model', 'Model number', 'e.g. 514A — also the page address /products/514A.'),
          t('name', 'Name'),
          { name: 'function', label: 'Function', type: 'select', options: FUNCTIONS },
          { name: 'hairTypes', label: 'Hair types', type: 'strings', help: 'One per line: fine, medium, thick, curly or all.' },
          t('size', 'Size', 'e.g. 18.5 cm'),
          ta('description', 'Description'),
          img('image', 'Image'),
        ],
      },
    ],
  },
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
