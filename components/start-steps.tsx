import { BookOpenCheck, CircleUserRound, RectangleEllipsis, ScanQrCode, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'scratch', label: 'Scratch Card', icon: Ticket },
  { id: 'scan', label: 'Scan QR Code', icon: ScanQrCode },
  { id: 'code', label: 'Enter Code', icon: RectangleEllipsis },
  { id: 'account', label: 'Create Account', icon: CircleUserRound },
  { id: 'training', label: 'Begin Training', icon: BookOpenCheck },
] as const;
export type StepId = (typeof STEPS)[number]['id'];

// The zigzag: "How to Start" low, then the steps alternate high / low (Scratch Card high, Scan QR low, …).
// Six columns on a 0–600 × 0–100 grid; the line runs at y=40 (high) and y=60 (low).
const Y = (col: number) => (col % 2 ? 40 : 60);
const POINTS = Array.from({ length: 6 }, (_, c) => `${c * 100 + 50},${Y(c)}`).join(' ');

/** The client's "How to Start" route — Scratch Card → Scan QR Code → Enter Code → Create Account → Begin Training. */
export function StartSteps({ active, className }: { active: StepId; className?: string }) {
  const at = STEPS.findIndex((s) => s.id === active);
  const tone = (i: number) => (i === at ? 'text-primary' : i < at ? 'text-white' : 'text-white/45');

  return (
    <div className={cn('rounded-xl bg-gradient-to-br from-ink via-ink to-[#2a2a2a] text-white', className)}>
      {/* Zigzag (tablet and up) */}
      <div className="relative hidden h-56 sm:block" aria-hidden>
        <svg viewBox="0 0 600 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
          <polyline points={POINTS} fill="none" stroke="currentColor" strokeOpacity="0.85" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="absolute left-0 top-[60%] w-1/6 pt-3 text-center text-sm text-white/80">How to Start</span>
        {STEPS.map(({ id, label, icon: Icon }, i) => {
          const high = (i + 1) % 2 === 1;
          return (
            <div
              key={id}
              className={cn(
                'absolute flex w-1/6 flex-col items-center gap-1.5 text-center text-sm',
                high ? 'bottom-[60%] flex-col-reverse pb-3' : 'top-[60%] pt-3',
                tone(i)
              )}
              style={{ left: `${((i + 1) * 100) / 6}%` }}
            >
              <Icon className={cn('size-8', i === at && 'drop-shadow-[0_0_8px_var(--color-primary)]')} strokeWidth={1.5} />
              <span className={cn('leading-tight', i === at && 'font-semibold')}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Phones: the same route as a list */}
      <ol className="space-y-3 p-5 sm:hidden">
        <li className="mono-tag text-[10px] text-white/60">How to Start</li>
        {STEPS.map(({ id, label, icon: Icon }, i) => (
          <li key={id} className={cn('flex items-center gap-3 text-sm', tone(i), i === at && 'font-semibold')}>
            <span className="mono-tag w-4 text-[10px] text-white/40">{i + 1}</span>
            <Icon className="size-5" strokeWidth={1.5} />
            {label}
          </li>
        ))}
      </ol>
      <p className="sr-only">
        Step {at + 1} of {STEPS.length}: {STEPS[at].label}
      </p>
    </div>
  );
}
