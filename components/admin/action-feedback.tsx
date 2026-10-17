'use client';

import { useState, useTransition } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Result = { ok: boolean; message: string; secret?: string };

/**
 * Runs a server action and keeps its message (and any one-time secret). Every admin action calls
 * revalidatePath, so Next streams the updated page back in the same response — no router.refresh():
 * refreshing while that response is still arriving aborts it and the action never settles.
 */
export function useAction() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      let r: Result;
      try {
        r = await fn();
      } catch (e) {
        // redirect() inside an action surfaces as a thrown NEXT_REDIRECT — let Next handle it.
        if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e;
        r = { ok: false, message: 'Something went wrong. Please try again.' };
      }
      setResult(r);
    });
  return { pending, result, run, clear: () => setResult(null) };
}

export function ActionMessage({ result }: { result: Result | null }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;
  return (
    <div role="status" className={cn('space-y-2 text-sm', result.ok ? 'text-foreground' : 'text-destructive')}>
      <p>{result.message}</p>
      {result.secret && (
        <div className="flex items-center gap-2 rounded-md border bg-secondary/50 p-2">
          <code className="flex-1 select-all font-mono text-base tracking-wider">{result.secret}</code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(result.secret!);
              setCopied(true);
            }}
          >
            {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      )}
    </div>
  );
}
