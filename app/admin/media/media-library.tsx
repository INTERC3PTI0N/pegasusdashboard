'use client';

import { useRef, useState, useTransition } from 'react';
import { Upload, Copy, Trash2, Check } from 'lucide-react';
import { uploadMedia, deleteMediaItem } from '../site/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Item {
  id: string;
  path: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  uploadedBy: string | null;
}

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function MediaLibrary({ items }: { items: Item[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const upload = (files: FileList) =>
    start(async () => {
      const fd = new FormData();
      for (const f of Array.from(files)) fd.append('files', f);
      setMessage((await uploadMedia(fd)).message);
    });

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
      >
        <Upload className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Drag files here, or</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          accept="image/*,video/mp4,video/webm"
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
        <Button disabled={pending} onClick={() => fileRef.current?.click()}>
          <Upload /> {pending ? 'Uploading…' : 'Choose files'}
        </Button>
        {message && <p className="text-sm" role="status">{message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => {
          const src = `/api/site/media/${m.id}`;
          return (
            <Card key={m.id} className="gap-0 overflow-hidden py-0">
              <div className="aspect-[4/3] bg-muted/40">
                {m.contentType.startsWith('video/') ? (
                  <video src={src} muted controls className="size-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={m.filename} className="size-full object-cover" />
                )}
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium" title={m.filename}>{m.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {kb(m.size)} · {new Date(m.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {m.uploadedBy && ` · ${m.uploadedBy}`}
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 flex-1 text-xs"
                    onClick={async () => {
                      await navigator.clipboard.writeText(m.path);
                      setCopied(m.id);
                      setTimeout(() => setCopied(null), 1500);
                    }}
                  >
                    {copied === m.id ? <Check /> : <Copy />} {copied === m.id ? 'Copied' : 'Copy path'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-destructive"
                    aria-label={`Delete ${m.filename}`}
                    disabled={pending}
                    onClick={() => {
                      if (!confirm(`Delete ${m.filename}? Any page still using it will show a broken image.`)) return;
                      start(async () => {
                        setMessage((await deleteMediaItem(m.id)).message);
                      });
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {items.length === 0 && <p className="text-sm text-muted-foreground">No files uploaded yet.</p>}
    </div>
  );
}
