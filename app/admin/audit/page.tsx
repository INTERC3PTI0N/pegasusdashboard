import { requireAdmin } from '@/lib/access';
import { getAuditLog } from '@/lib/site/store';
import { getDocDef } from '@/lib/site/schema';
import { ACTIONS } from '@/lib/audit-labels';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  await requireAdmin('audit');
  const entries = await getAuditLog();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="mono-tag text-[10px] text-primary mb-2">System</p>
        <h1 className="editorial-text text-4xl">Audit log</h1>
        <p className="mt-2 text-sm text-muted-foreground">Every admin change, newest first (last 500).</p>
      </div>
      <Card className="py-0">
        <CardContent className="px-3 py-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>What</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {e.at.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>{e.actorEmail}</TableCell>
                  <TableCell>{ACTIONS[e.action] ?? e.action}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {(e.target && getDocDef(e.target)?.label) ?? e.target}
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">No admin activity yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
