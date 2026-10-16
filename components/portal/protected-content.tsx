'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

const isEditable = (t: EventTarget | null) =>
  t instanceof Element && !!t.closest('input, textarea, [contenteditable="true"]');

/**
 * Deterrents for the whole portal: no right-click, copy, text selection, dragging,
 * Save (Ctrl/Cmd+S), View source (Ctrl/Cmd+U) or Print (Ctrl/Cmd+P). Form fields keep working.
 * These stop casual saving only — the real protection is the gated media route + watermark.
 */
export function ContentGuard() {
  useEffect(() => {
    const block = (e: Event) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const keys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'u', 'p'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const events = ['contextmenu', 'copy', 'cut', 'dragstart', 'selectstart'] as const;
    events.forEach((ev) => document.addEventListener(ev, block));
    document.addEventListener('keydown', keys);
    return () => {
      events.forEach((ev) => document.removeEventListener(ev, block));
      document.removeEventListener('keydown', keys);
    };
  }, []);
  return null;
}

/** The viewer's identity drifting across the content, so leaked recordings trace back to an account. */
export function Watermark({ text, className }: { text: string; className?: string }) {
  const [pos, setPos] = useState({ top: 8, left: 6 });
  useEffect(() => {
    const id = setInterval(() => setPos({ top: 5 + Math.random() * 80, left: 3 + Math.random() * 55 }), 7000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute z-10 select-none whitespace-nowrap font-mono text-xs transition-all duration-[2000ms]',
        className
      )}
      style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
    >
      {text}
    </span>
  );
}

export function ProtectedVideo({ src, poster, watermark }: { src: string; poster?: string; watermark: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === wrap.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Fullscreen the wrapper, not the <video>, so the watermark stays on screen.
  const toggleFullscreen = () => {
    if (document.fullscreenElement) return document.exitFullscreen();
    if (wrap.current?.requestFullscreen) return wrap.current.requestFullscreen();
    // iPhone Safari only allows native video fullscreen (watermark can't follow there).
    (video.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void })?.webkitEnterFullscreen?.();
  };

  return (
    <div
      ref={wrap}
      className="group relative bg-ink [&:fullscreen]:flex [&:fullscreen]:items-center"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={video}
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        className={cn('w-full', full ? 'h-full object-contain' : 'aspect-video')}
      />
      <Watermark text={watermark} className="text-white/45 [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]" />
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={full ? 'Exit fullscreen' : 'Fullscreen'}
        className="absolute right-3 top-3 z-20 rounded-md bg-black/55 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        {full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
      </button>
    </div>
  );
}
