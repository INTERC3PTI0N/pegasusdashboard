'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { KeyRound, Lock, X } from 'lucide-react';
import { ProtectedVideo } from './protected-content';
import { Button } from '@/components/ui/button';

/** A Mastery-only lesson for Essential holders: its preview clip, then a pop-up to get the Mastery Kit. */
export function LockedPreview({ src, poster, watermark }: { src?: string; poster: string; watermark: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const show = () => dialog.current?.showModal();

  return (
    <>
      {src ? (
        <ProtectedVideo src={src} poster={poster} watermark={watermark} onEnded={show} />
      ) : (
        <button type="button" onClick={show} className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-md" />
          <span className="relative flex flex-col items-center gap-2 text-white">
            <Lock className="size-8" />
            <span className="mono-tag text-[11px]">Mastery Kit lesson</span>
          </span>
        </button>
      )}

      <dialog
        ref={dialog}
        className="m-auto w-[min(92vw,26rem)] rounded-xl border bg-background p-6 text-foreground shadow-xl backdrop:bg-ink/60"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
        <div className="space-y-4 text-center">
          <Lock className="mx-auto size-8 text-primary" />
          <p className="editorial-text text-2xl">Buy the Mastery Kit to get complete access</p>
          <p className="text-sm text-muted-foreground">
            The Mastery Kit unlocks all lessons of the course with unlimited access and the PEGASUS® Masterclass certificate.
          </p>
          <Button asChild className="w-full">
            <Link href="/register-kit"><KeyRound /> Already have one? Register it</Link>
          </Button>
        </div>
      </dialog>
    </>
  );
}
