'use client';

import { useEffect, useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { courseFields } from '@/lib/course-schema';
import type { Content } from '@/lib/site/schema';
import { saveCourseAction, deleteCourseAction } from '../../actions';
import { Fields } from '@/components/admin/schema-form';
import { useAction, ActionMessage } from '@/components/admin/action-feedback';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function CourseEditor({ slug, initial, deletable }: { slug: string; initial: Content; deletable: boolean }) {
  const initialJson = JSON.stringify(initial);
  const [content, setContent] = useState<Content>(initial);
  const { pending, result, run } = useAction();
  const dirty = JSON.stringify(content) !== initialJson;

  useEffect(() => setContent(JSON.parse(initialJson)), [initialJson]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <Card className="min-w-0">
        <CardContent className="space-y-5">
          {/* Paths like /images/… belong to this app, so thumbnails resolve against it (''). */}
          <Fields fields={courseFields} value={content} onChange={setContent} siteUrl="" />
        </CardContent>
      </Card>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="gap-3 py-5">
          <CardContent className="space-y-3">
            <Button className="w-full" disabled={pending || !dirty} onClick={() => run(() => saveCourseAction(slug, content))}>
              <Save /> {pending ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </Button>
            {dirty && (
              <Button variant="ghost" className="w-full" onClick={() => setContent(JSON.parse(initialJson))}>
                Discard changes
              </Button>
            )}
            <ActionMessage result={result} />
            <p className="text-xs text-muted-foreground">
              Saving updates the course for customers immediately. Removing a lesson removes it from everyone’s
              progress count; re-adding it with the same ID restores their ticks.
            </p>
          </CardContent>
        </Card>
        {deletable && (
          <Button
            variant="ghost"
            className="w-full text-destructive"
            disabled={pending}
            onClick={() => confirm('Delete this course permanently?') && run(() => deleteCourseAction(slug))}
          >
            <Trash2 /> Delete course
          </Button>
        )}
      </aside>
    </div>
  );
}
