'use client';

import { useId, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Trash2, Plus, Upload, Images } from 'lucide-react';
import type { Field, Content } from '@/lib/site/schema';
import { uploadMedia, listMediaForPicker } from '@/app/admin/site/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Form generated from a Field[] schema (website blocks, courses). Lists can be added to,
 * reordered and removed; image/video fields upload to the media library or pick from it.
 */

const textareaCls =
  'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

/**
 * Where the dashboard can show a thumbnail for a media path. `siteUrl` is the origin that
 * site-relative paths belong to: the public website's URL, or '' for this app itself.
 */
export function previewSrc(src: string, siteUrl: string | null): string | null {
  if (!src) return null;
  if (src.startsWith('/cms-media/')) return `/api/site/media/${src.slice('/cms-media/'.length)}`;
  if (src.startsWith('/media/')) return null; // bundled course videos are never publicly reachable
  if (src.startsWith('/')) return siteUrl === null ? null : siteUrl + src;
  return src;
}

function blank(fields: Field[]): Content {
  return Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.type === 'list' || f.type === 'strings' ? [] : f.type === 'number' ? 0 : f.type === 'select' ? f.options[0].value : '',
    ])
  );
}

// ── Field inputs ────────────────────────────────────────────────────────────

function MediaField({
  id,
  field,
  value,
  onChange,
  siteUrl,
}: {
  id: string;
  field: Field;
  value: string;
  onChange: (v: string) => void;
  siteUrl: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [library, setLibrary] = useState<{ path: string; filename: string; contentType: string }[] | null>(null);
  const isVideo = field.type === 'video';
  const src = previewSrc(value, siteUrl);

  const upload = async (file: File) => {
    setBusy(true);
    const fd = new FormData();
    fd.append('files', file);
    const res = await uploadMedia(fd);
    setBusy(false);
    setNote(res.message);
    if (res.paths[0]) onChange(res.paths[0]);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
          {src ? (
            isVideo ? (
              <video src={src} muted className="size-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" className="size-full object-cover" />
            )
          ) : (
            <Images className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="/images/… or https://…" />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              hidden
              accept={isVideo ? 'video/mp4,video/webm' : 'image/*'}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload /> {busy ? 'Uploading…' : 'Upload'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => setLibrary(library ? null : await listMediaForPicker())}
            >
              <Images /> Library
            </Button>
          </div>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
      </div>
      {library && (
        <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto rounded-md border p-2 sm:grid-cols-6">
          {library.filter((m) => m.contentType.startsWith(isVideo ? 'video/' : 'image/')).length === 0 && (
            <p className="col-span-full p-3 text-xs text-muted-foreground">Nothing uploaded yet.</p>
          )}
          {library
            .filter((m) => m.contentType.startsWith(isVideo ? 'video/' : 'image/'))
            .map((m) => (
              <button
                key={m.path}
                type="button"
                title={m.filename}
                onClick={() => {
                  onChange(m.path);
                  setLibrary(null);
                }}
                className="aspect-square overflow-hidden rounded border hover:ring-2 hover:ring-primary"
              >
                {isVideo ? (
                  <video src={previewSrc(m.path, siteUrl)!} muted className="size-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc(m.path, siteUrl)!} alt={m.filename} className="size-full object-cover" />
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function ListField({
  field,
  value,
  onChange,
  siteUrl,
}: {
  field: Extract<Field, { type: 'list' }>;
  value: Content[];
  onChange: (v: Content[]) => void;
  siteUrl: string | null;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const move = (i: number, d: number) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
    setOpen(open === i ? i + d : open);
  };

  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="rounded-md border">
          <div className="flex items-center gap-1 px-3 py-2">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
            >
              {open === i ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
              <span className="truncate font-medium">{String(item[field.itemTitle] || `Item ${i + 1}`)}</span>
            </button>
            <Button type="button" size="icon" variant="ghost" className="size-7" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
              <ArrowUp />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="size-7" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
              <ArrowDown />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7 text-destructive"
              aria-label="Remove"
              onClick={() => {
                if (confirm(`Remove "${String(item[field.itemTitle] || `Item ${i + 1}`)}"?`)) {
                  onChange(value.filter((_, j) => j !== i));
                  setOpen(null);
                }
              }}
            >
              <Trash2 />
            </Button>
          </div>
          {open === i && (
            <div className="space-y-4 border-t px-3 py-4">
              <Fields
                fields={field.fields}
                value={item}
                onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))}
                siteUrl={siteUrl}
              />
            </div>
          )}
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          onChange([...value, blank(field.fields)]);
          setOpen(value.length);
        }}
      >
        <Plus /> Add
      </Button>
    </div>
  );
}

export function Fields({
  fields,
  value,
  onChange,
  siteUrl,
}: {
  fields: Field[];
  value: Content;
  onChange: (v: Content) => void;
  siteUrl: string | null;
}) {
  const set = (name: string, v: unknown) => onChange({ ...value, [name]: v });

  return (
    <>
      {fields.map((f) => (
        <FieldRow key={f.name} f={f} v={value[f.name]} set={(x) => set(f.name, x)} siteUrl={siteUrl} />
      ))}
    </>
  );
}

function FieldRow({ f, v, set, siteUrl }: { f: Field; v: unknown; set: (v: unknown) => void; siteUrl: string | null }) {
  const id = useId();
  let input: React.ReactNode;
  switch (f.type) {
    case 'textarea':
    case 'longtext':
      input = (
        <textarea
          id={id}
          rows={f.type === 'longtext' ? 14 : 3}
          className={textareaCls}
          value={String(v ?? '')}
          onChange={(e) => set(e.target.value)}
        />
      );
      break;
    case 'number':
      input = <Input id={id} type="number" value={Number(v ?? 0)} onChange={(e) => set(Number(e.target.value))} />;
      break;
    case 'select':
      input = (
        <select
          id={id}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={String(v ?? '')}
          onChange={(e) => set(e.target.value)}
        >
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
      break;
    case 'strings':
      input = (
        <textarea
          id={id}
          rows={4}
          className={textareaCls}
          value={(Array.isArray(v) ? v : []).join('\n')}
          onChange={(e) => set(e.target.value.split('\n'))}
        />
      );
      break;
    case 'image':
    case 'video':
      input = <MediaField id={id} field={f} value={String(v ?? '')} onChange={(x) => set(x)} siteUrl={siteUrl} />;
      break;
    case 'list':
      input = (
        <ListField field={f} value={Array.isArray(v) ? (v as Content[]) : []} onChange={(x) => set(x)} siteUrl={siteUrl} />
      );
      break;
    default:
      input = (
        <Input
          id={id}
          value={String(v ?? '')}
          onChange={(e) => set(e.target.value)}
          placeholder={f.type === 'url' ? '/#section, /collections/…, or https://…' : undefined}
        />
      );
  }
  return (
    <div className="space-y-1.5">
      {/* Lists are groups of fields, not one control: label them as a heading, not a <label>. */}
      {f.type === 'list' ? <p className="text-sm font-medium leading-none">{f.label}</p> : <Label htmlFor={id}>{f.label}</Label>}
      {input}
      {f.type === 'strings' && <p className="text-xs text-muted-foreground">One per line.</p>}
      {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
    </div>
  );
}

