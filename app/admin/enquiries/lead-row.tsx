'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, ChevronUp, Mail, Trash2 } from 'lucide-react';
import { saveLead, removeLead } from '../site/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Lead {
  id: string;
  kind: 'brochure' | 'dealer' | 'business';
  name: string;
  email: string;
  company: string;
  country: string;
  role: string;
  interest: string;
  message: string;
  marketingConsent: boolean;
  status: 'new' | 'contacted' | 'closed';
  notes: string;
  createdAt: string;
}

const KIND_LABEL = { brochure: 'Brochure', dealer: 'Dealer', business: 'Business' };
const STATUS_CLS = {
  new: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  contacted: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  closed: 'bg-muted text-muted-foreground',
};

export function LeadRow({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const details: [string, string][] = [
    ['Email', lead.email],
    ['Company / salon', lead.company],
    ['Country', lead.country],
    ['Role', lead.role],
    ['Catalogue', lead.interest],
    ['Marketing consent', lead.marketingConsent ? 'Yes' : 'No'],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/40">
        {open ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {lead.name || lead.email} {lead.company && <span className="font-normal text-muted-foreground">· {lead.company}</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">{lead.message || lead.email}</p>
        </div>
        <Badge variant="outline" className="shrink-0">{KIND_LABEL[lead.kind]}</Badge>
        <Badge className={`shrink-0 capitalize ${STATUS_CLS[lead.status]}`}>{lead.status}</Badge>
        <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
          {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </button>

      {open && (
        <div className="grid gap-6 border-t bg-secondary/20 px-4 py-4 md:grid-cols-2">
          <div className="space-y-3 text-sm">
            <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5">
              {details.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="break-words">{v}</dd>
                </div>
              ))}
            </dl>
            {lead.message && <p className="whitespace-pre-wrap rounded-md border bg-background p-3">{lead.message}</p>}
            <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <Mail className="size-4" /> Reply by email
            </a>
          </div>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Lead['status'])}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Internal notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    setMsg((await saveLead(lead.id, status, notes)).message);
                  })
                }
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={pending}
                onClick={() => {
                  if (!confirm('Delete this enquiry permanently?')) return;
                  start(async () => {
                    await removeLead(lead.id);
                  });
                }}
              >
                <Trash2 /> Delete
              </Button>
              {msg && <span className="text-xs text-muted-foreground" role="status">{msg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
