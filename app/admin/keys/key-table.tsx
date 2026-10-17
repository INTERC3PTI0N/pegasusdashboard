'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ban, Undo2 } from 'lucide-react';
import { voidKeysAction, unvoidKeyAction } from '../actions';
import { useAction, ActionMessage } from '@/components/admin/action-feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface KeyRow {
  code: string;
  product: string;
  batch: string;
  status: 'available' | 'used' | 'voided';
  usedBy: string | null;
  usedByEmail: string | null;
  usedAt: string | null;
  addedAt: string;
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function KeyTable({ keys }: { keys: KeyRow[] }) {
  const { pending, result, run } = useAction();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const voidable = keys.filter((k) => k.status === 'available');
  const allSelected = voidable.length > 0 && voidable.every((k) => selected.has(k.code));

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex min-h-9 flex-wrap items-center gap-3 px-2">
        {selected.size > 0 ? (
          <>
            <span className="text-sm">{selected.size} selected</span>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!confirm(`Void ${selected.size} key${selected.size === 1 ? '' : 's'}? They will be rejected if anyone tries to redeem them.`)) return;
                run(async () => {
                  const r = await voidKeysAction([...selected]);
                  setSelected(new Set());
                  return r;
                });
              }}
            >
              <Ban /> Void selected
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Tick available keys to void them.</span>
        )}
        <ActionMessage result={result} />
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <input
                  type="checkbox"
                  aria-label="Select all available keys"
                  checked={allSelected}
                  disabled={voidable.length === 0}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(voidable.map((k) => k.code)))}
                />
              </TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Redeemed by</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={k.code} className={k.status === 'voided' ? 'opacity-60' : ''}>
                <TableCell>
                  {k.status === 'available' && (
                    <input type="checkbox" aria-label={`Select ${k.code}`} checked={selected.has(k.code)} onChange={() => toggle(k.code)} />
                  )}
                </TableCell>
                <TableCell className={`font-mono text-xs tracking-wider ${k.status === 'voided' ? 'line-through' : ''}`}>{k.code}</TableCell>
                <TableCell>{k.product}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{k.batch || '—'}</TableCell>
                <TableCell>
                  {k.status === 'used' && <Badge variant="secondary">Used {k.usedAt && day(k.usedAt)}</Badge>}
                  {k.status === 'available' && <Badge variant="success">Available</Badge>}
                  {k.status === 'voided' && (
                    <span className="inline-flex items-center gap-1">
                      <Badge variant="outline">Voided</Badge>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Restore ${k.code}`}
                        title="Make redeemable again"
                        disabled={pending}
                        onClick={() => confirm(`Make ${k.code} redeemable again?`) && run(() => unvoidKeyAction(k.code))}
                      >
                        <Undo2 className="size-3.5" />
                      </button>
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {k.usedBy ? (
                    <Link href={`/admin/customers/${k.usedBy}`} className="hover:text-primary">{k.usedByEmail}</Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{day(k.addedAt)}</TableCell>
              </TableRow>
            ))}
            {keys.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No product keys match.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
