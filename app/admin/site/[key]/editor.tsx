'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Save,
  Rocket,
  Undo2,
  Eye,
  ExternalLink,
  History,
  RotateCcw,
} from 'lucide-react';
import type { Field, Content } from '@/lib/site/schema';
import { saveDocDraft, publishDoc, discardDocDraft, restoreDocVersion } from '../actions';
import { Fields } from '@/components/admin/schema-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Status {
  hasDraft: boolean;
  isPublished: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ── Editor shell ────────────────────────────────────────────────────────────

export function Editor({
  docKey,
  fields,
  initial,
  status,
  versions,
  liveUrl,
  previewUrl,
  siteUrl,
}: {
  docKey: string;
  fields: Field[];
  initial: Content;
  status: Status;
  versions: { id: string; publishedAt: string; publishedBy: string | null }[];
  liveUrl: string | null;
  previewUrl: string | null;
  siteUrl: string | null;
}) {
  const initialJson = JSON.stringify(initial);
  const [content, setContent] = useState<Content>(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(content) !== initialJson;

  // Server data changed (save / discard / restore): show it.
  useEffect(() => setContent(JSON.parse(initialJson)), [initialJson]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const res = await fn();
      setMessage({ ok: res.ok, text: res.message });
    });

  const canPublish = dirty || status.hasDraft;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Card className="min-w-0">
        <CardContent className="space-y-5">
          <Fields fields={fields} value={content} onChange={setContent} siteUrl={siteUrl} />
        </CardContent>
      </Card>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="gap-3 py-5">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {dirty && <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400">Unsaved edits</Badge>}
              {status.hasDraft && <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">Draft saved</Badge>}
              {status.isPublished ? <Badge variant="success">Live</Badge> : <Badge variant="outline">Original copy</Badge>}
            </div>
            <dl className="space-y-1 text-xs text-muted-foreground">
              <div>Last edited: {fmt(status.updatedAt)}{status.updatedBy && ` · ${status.updatedBy}`}</div>
              <div>Last published: {fmt(status.publishedAt)}{status.publishedBy && ` · ${status.publishedBy}`}</div>
            </dl>

            <div className="grid gap-2">
              <Button disabled={pending || !dirty} variant="outline" onClick={() => run(() => saveDocDraft(docKey, content))}>
                <Save /> Save draft
              </Button>
              <Button
                disabled={pending || !canPublish}
                onClick={() => {
                  if (confirm('Publish these changes to the live website?')) run(() => publishDoc(docKey, dirty ? content : undefined));
                }}
              >
                <Rocket /> {pending ? 'Working…' : 'Publish'}
              </Button>
              {previewUrl && (
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      if (dirty) await saveDocDraft(docKey, content); // preview shows saved drafts
                      window.open(previewUrl, '_blank', 'noopener');
                    })
                  }
                >
                  <Eye /> Preview draft
                </Button>
              )}
              {liveUrl && (
                <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center gap-2 rounded-md text-sm hover:bg-secondary">
                  <ExternalLink className="size-4" /> View live
                </a>
              )}
              {(status.hasDraft || dirty) && (
                <Button
                  variant="ghost"
                  className="text-destructive"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm('Throw away all unpublished changes to this block?')) return;
                    if (status.hasDraft) run(() => discardDocDraft(docKey));
                    else setContent(JSON.parse(initialJson));
                  }}
                >
                  <Undo2 /> Discard changes
                </Button>
              )}
            </div>
            {message && (
              <p role="status" className={cn('text-sm', message.ok ? 'text-foreground' : 'text-destructive')}>
                {message.text}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="gap-3 py-5">
          <CardContent className="space-y-3">
            <p className="mono-tag flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <History className="size-3" /> Publish history
            </p>
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {versions.map((v, i) => (
                <li key={v.id} className="flex items-center justify-between gap-2 rounded px-1 py-1 text-xs hover:bg-secondary/60">
                  <span>
                    {fmt(v.publishedAt)}
                    {i === 0 && status.isPublished && <span className="ml-1 text-primary">(live)</span>}
                    <br />
                    <span className="text-muted-foreground">{v.publishedBy}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    disabled={pending}
                    onClick={() => {
                      if (confirm('Load this version into the draft? You can review it before publishing.'))
                        run(() => restoreDocVersion(docKey, v.id));
                    }}
                  >
                    <RotateCcw className="size-3" /> Restore
                  </Button>
                </li>
              ))}
              {versions.length === 0 && <li className="text-xs text-muted-foreground">Not published yet.</li>}
            </ul>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              disabled={pending}
              onClick={() => {
                if (confirm('Load the original website copy into the draft?')) run(() => restoreDocVersion(docKey, 'original'));
              }}
            >
              <RotateCcw className="size-3" /> Restore original copy
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
