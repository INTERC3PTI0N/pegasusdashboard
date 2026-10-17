'use client';

import { useTransition, useState } from 'react';
import { Rocket } from 'lucide-react';
import { publishAllDrafts } from './actions';
import { Button } from '@/components/ui/button';

export function PublishAllButton({ count }: { count: number }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      {message && <span className="text-xs text-muted-foreground" role="status">{message}</span>}
      <Button
        disabled={pending || count === 0}
        onClick={() => {
          if (!confirm(`Publish ${count} block${count === 1 ? '' : 's'} with unpublished changes to the live website?`)) return;
          start(async () => setMessage((await publishAllDrafts()).message));
        }}
      >
        <Rocket /> {pending ? 'Publishing…' : count ? `Publish all (${count})` : 'Nothing to publish'}
      </Button>
    </div>
  );
}
