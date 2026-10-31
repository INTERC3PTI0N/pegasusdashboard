import type { Field } from './site/schema';

/** Admin → Courses editor form. Same field system as the website editor. */
export const courseFields: Field[] = [
  { name: 'name', label: 'Course name', type: 'text' },
  { name: 'line', label: 'Series / product line', type: 'text', help: 'e.g. "Flexinite Series"' },
  { name: 'tagline', label: 'Tagline', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'image', label: 'Cover image', type: 'image', help: 'Cards, thumbnail and video cover. 16:9, e.g. 1920×1080.' },
  { name: 'banner', label: 'Banner image', type: 'image', help: 'Optional header on the course page, shown whole. 4:1, e.g. 2400×600.' },
  {
    name: 'lessons',
    label: 'Lessons (in order)',
    type: 'list',
    itemTitle: 'title',
    fields: [
      { name: 'title', label: 'Lesson title', type: 'text' },
      {
        name: 'type',
        label: 'Lesson type',
        type: 'select',
        options: [
          { value: 'video', label: 'Video lesson' },
          { value: 'guide', label: 'Written guide' },
        ],
      },
      {
        name: 'tier',
        label: 'Included in',
        type: 'select',
        options: [
          { value: 'essential', label: 'Essential Kit (and Mastery Kit)' },
          { value: 'mastery', label: 'Mastery Kit only' },
        ],
        help: 'Essential Kit holders see Mastery-only lessons locked, with the preview below if there is one.',
      },
      { name: 'duration', label: 'Duration', type: 'text', help: 'e.g. "8 min" or "4 min read"' },
      { name: 'summary', label: 'Summary', type: 'textarea' },
      {
        name: 'videoFile',
        label: 'Video (video lessons)',
        type: 'video',
        help: 'Upload an MP4 (up to 4 MB) or pick one from the library. Only customers who own this course can stream it.',
      },
      {
        name: 'previewFile',
        label: 'Preview clip (Mastery-only lessons)',
        type: 'video',
        help: 'Optional short teaser that Essential Kit holders can watch to see what the Mastery Kit unlocks.',
      },
      {
        name: 'guide',
        label: 'Guide sections (written guides)',
        type: 'list',
        itemTitle: 'heading',
        fields: [
          { name: 'heading', label: 'Heading', type: 'text' },
          { name: 'body', label: 'Text', type: 'longtext' },
        ],
      },
      {
        name: 'id',
        label: 'Lesson ID',
        type: 'text',
        help: 'Leave blank for new lessons — it is generated. Changing it resets customers’ progress for this lesson.',
      },
    ],
  },
];
