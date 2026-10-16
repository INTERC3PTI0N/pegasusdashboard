'use client';

import { useActionState } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { uploadProductKeys } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function UploadForm({ products }: { products: { slug: string; name: string }[] }) {
  const [result, action, pending] = useActionState(uploadProductKeys, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="product">Product</Label>
        <select id="product" name="product" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="codes">Paste keys</Label>
        <textarea
          id="codes"
          name="codes"
          rows={6}
          placeholder={'AB12-CD34-EF56\nGH78-JK90-LM12'}
          className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="file">…or upload a .csv / .txt file</Label>
        <input id="file" name="file" type="file" accept=".csv,.txt,text/plain,text/csv" className="block text-sm" />
      </div>
      <Button type="submit" name="intent" value="upload" disabled={pending}>
        <Upload /> {pending ? 'Working…' : 'Upload keys'}
      </Button>

      <div className="space-y-1.5 border-t pt-4">
        <Label htmlFor="count">…or generate random keys for this product</Label>
        <div className="flex gap-2">
          <Input id="count" name="count" type="number" min={1} max={1000} defaultValue={10} className="w-24" />
          <Button type="submit" name="intent" value="generate" variant="outline" disabled={pending}>
            <Sparkles /> Generate
          </Button>
        </div>
      </div>

      {result && (
        <div className="rounded-md border p-3 text-sm space-y-1" role="status">
          {result.error && <p className="text-destructive">{result.error}</p>}
          {!result.error && (
            <p>
              Added <strong>{result.added}</strong>
              {result.duplicates > 0 && <> · {result.duplicates} already on file</>}
            </p>
          )}
          {result.generated && (
            <textarea
              readOnly
              rows={Math.min(result.generated.length, 8)}
              value={result.generated.join('\n')}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Generated keys"
              className="mt-1 w-full rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs"
            />
          )}
          {result.invalid.length > 0 && (
            <p className="text-muted-foreground">
              Skipped {result.invalid.length} invalid:{' '}
              <span className="font-mono">{result.invalid.slice(0, 10).join(', ')}{result.invalid.length > 10 && ' …'}</span>
            </p>
          )}
        </div>
      )}
    </form>
  );
}
