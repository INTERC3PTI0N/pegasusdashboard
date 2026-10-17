'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { moveCourseAction, createCourseAction } from '../actions';
import { useAction, ActionMessage } from '@/components/admin/action-feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CourseOrder({ slug, first, last }: { slug: string; first: boolean; last: boolean }) {
  const { pending, run } = useAction();
  return (
    <div className="flex flex-col">
      <Button size="icon" variant="ghost" className="size-6" disabled={pending || first} aria-label="Move up" onClick={() => run(() => moveCourseAction(slug, -1))}>
        <ArrowUp className="size-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="size-6" disabled={pending || last} aria-label="Move down" onClick={() => run(() => moveCourseAction(slug, 1))}>
        <ArrowDown className="size-3.5" />
      </Button>
    </div>
  );
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export function NewCourseForm() {
  const { pending, result, run } = useAction();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [touched, setTouched] = useState(false);

  return (
    <form className="space-y-3" action={(fd) => run(() => createCourseAction(fd))}>
      <p className="font-medium">New course</p>
      <div className="space-y-1">
        <Label htmlFor="c-name">Name</Label>
        <Input
          id="c-name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!touched) setSlug(slugify(e.target.value));
          }}
          placeholder="e.g. Carbon · ThermoGlide"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-slug">URL name</Label>
        <Input id="c-slug" name="slug" value={slug} onChange={(e) => { setTouched(true); setSlug(e.target.value); }} className="font-mono" />
        <p className="text-xs text-muted-foreground">Used in links and on keys. Can’t be changed later.</p>
      </div>
      <Button disabled={pending || !name || !slug}><Plus /> Create course</Button>
      <ActionMessage result={result} />
    </form>
  );
}
