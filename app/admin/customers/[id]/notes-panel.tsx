'use client';

import { useState } from 'react';
import { StickyNote, Plus } from 'lucide-react';
import type { CrmNote } from '@/lib/crm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

/**
 * Frontend-only CRM notes: seeded from demo data, new notes live in
 * component state for the session (no persistence by design).
 */
export function NotesPanel({ seedNotes, adminName }: { seedNotes: CrmNote[]; adminName: string }) {
  const [notes, setNotes] = useState<CrmNote[]>(seedNotes);
  const [draft, setDraft] = useState('');

  function addNote() {
    const body = draft.trim();
    if (!body) return;
    setNotes([
      {
        id: `n-${Date.now()}`,
        author: adminName,
        date: new Date().toISOString(),
        body,
      },
      ...notes,
    ]);
    setDraft('');
  }

  return (
    <Card className="py-5 gap-3">
      <CardContent className="space-y-4">
        <p className="mono-tag flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <StickyNote className="size-3" /> Notes
        </p>

        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Log a call, meeting or follow-up…"
            rows={3}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
          />
          <Button size="sm" onClick={addNote} disabled={!draft.trim()} className="w-full">
            <Plus /> Add note
          </Button>
        </div>

        <Separator />

        <ul className="space-y-4">
          {notes.map((note) => (
            <li key={note.id} className="space-y-1">
              <p className="text-sm leading-relaxed">{note.body}</p>
              <p className="text-xs text-muted-foreground">
                {note.author} ·{' '}
                {new Date(note.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </li>
          ))}
          {notes.length === 0 && (
            <li className="text-sm text-muted-foreground">No notes yet.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
