import Link from 'next/link';
import { ArrowRight, ExternalLink, Globe } from 'lucide-react';
import { requireAdmin } from '@/lib/access';
import { docs } from '@/lib/site/schema';
import { getAllDocStates } from '@/lib/site/store';
import { siteUrl } from '@/lib/site/remote';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublishAllButton } from './publish-all';

export const dynamic = 'force-dynamic';

function fmt(d: Date | null) {
  return d ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
}

export default async function SiteContentPage() {
  await requireAdmin('site');
  const states = await getAllDocStates();
  const site = siteUrl();
  const draftCount = states.filter((s) => s.hasDraft).length;
  const groups = ['Site-wide', 'Home page', 'Collections'] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-tag text-[10px] text-primary mb-2">Website</p>
          <h1 className="editorial-text text-4xl">Site content</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Edit every section of the public Pegasus website. Changes are saved as drafts and only go
            live when you publish. Every publish is kept in the history so it can be restored.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {site && (
            <a
              href={site}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-secondary"
            >
              <Globe className="size-4" /> Open website <ExternalLink className="size-3.5" />
            </a>
          )}
          <PublishAllButton count={draftCount} />
        </div>
      </div>

      {!site && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          Set <code className="font-mono">SITE_URL</code> and <code className="font-mono">SITE_SECRET</code> to enable
          previews and instant refresh of the website after publishing.
        </p>
      )}

      {groups.map((group) => (
        <section key={group} className="space-y-3">
          <h2 className="mono-tag text-[11px] text-muted-foreground">{group}</h2>
          <Card className="py-0 gap-0">
            <CardContent className="divide-y p-0">
              {docs
                .filter((d) => d.group === group)
                .map((d) => {
                  const s = states.find((x) => x.key === d.key)!;
                  return (
                    <Link
                      key={d.key}
                      href={`/admin/site/${d.key}`}
                      className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 hover:bg-secondary/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{d.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{d.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.hasDraft && <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">Unpublished changes</Badge>}
                        {s.isPublished ? (
                          <Badge variant="success">Live</Badge>
                        ) : (
                          <Badge variant="outline">Original copy</Badge>
                        )}
                      </div>
                      <div className="w-40 text-right text-xs text-muted-foreground">
                        {s.updatedAt ? <>Edited {fmt(s.updatedAt)}<br />{s.updatedBy}</> : 'Never edited'}
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}
