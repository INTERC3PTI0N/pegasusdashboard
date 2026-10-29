'use client';

import { useOptimistic, useTransition } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { toggleLessonComplete } from '@/app/actions';
import { Button } from '@/components/ui/button';

export function MarkCompleteButton({
  productSlug,
  lessonId,
  initialComplete,
}: {
  productSlug: string;
  lessonId: string;
  initialComplete: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [complete, setOptimistic] = useOptimistic(initialComplete);

  function toggle() {
    startTransition(async () => {
      setOptimistic(!complete);
      await toggleLessonComplete(productSlug, lessonId, !complete);
    });
  }

  return (
    <Button
      onClick={toggle}
      disabled={pending}
      variant={complete ? 'secondary' : 'default'}
      className="gap-2"
    >
      {complete ? (
        <>
          <CheckCircle2 className="text-primary" /> Completed — click to undo
        </>
      ) : (
        <>
          <Circle /> Mark as complete
        </>
      )}
    </Button>
  );
}
