/**
 * Kits are what customers buy and register (with a one-time key). Access rules:
 * - ESSENTIAL KIT: lessons marked "essential" (the first 4 videos) for 12 months from registration.
 * - MASTERY KIT: every lesson, no expiry, and the Mastery Certificate on completion.
 *   Mastery includes everything in Essential.
 * Pure functions — shared by server checks and UI.
 */

export type KitId = 'essential' | 'mastery';
export type LessonTier = KitId;

export interface KitDef {
  id: KitId;
  name: string;
  short: string;
  /** Months of access from registration; null = unlimited. */
  months: number | null;
  certificate: boolean;
  summary: string;
}

export const KITS: Record<KitId, KitDef> = {
  essential: {
    id: 'essential',
    name: 'Essential Kit',
    short: 'Essential',
    months: 12,
    certificate: false,
    summary: 'The Essential Course (lessons 1–4), with 12 months of access.',
  },
  mastery: {
    id: 'mastery',
    name: 'Mastery Kit',
    short: 'Mastery',
    months: null,
    certificate: true,
    summary: 'The Essential Course and the Masterclass (all 10 lessons), unlimited access, and the certificate.',
  },
};

export const KIT_IDS = Object.keys(KITS) as KitId[];
export const isKitId = (v: unknown): v is KitId => typeof v === 'string' && v in KITS;

export interface UserKit {
  kit: KitId;
  registeredAt: Date;
  /** null = never expires */
  expiresAt: Date | null;
}

export interface Access {
  mastery: boolean;
  /** Essential lessons are open (via an active Essential Kit, or via Mastery). */
  essential: boolean;
  /** The customer's own Essential registration, if any (for showing dates). */
  essentialKit: UserKit | null;
  essentialExpired: boolean;
  /** Has registered any kit (even an expired one) — may see the course and previews. */
  anyKit: boolean;
}

export function kitAccess(kits: UserKit[], now = new Date()): Access {
  const mastery = kits.some((k) => k.kit === 'mastery' && (!k.expiresAt || k.expiresAt > now));
  const essentialKit = kits.find((k) => k.kit === 'essential') ?? null;
  const essentialActive = !!essentialKit && (!essentialKit.expiresAt || essentialKit.expiresAt > now);
  return {
    mastery,
    essential: mastery || essentialActive,
    essentialKit,
    essentialExpired: !!essentialKit && !essentialActive,
    anyKit: kits.length > 0,
  };
}

export function canOpenLesson(access: Access, tier: LessonTier | undefined): boolean {
  return (tier ?? 'mastery') === 'essential' ? access.essential : access.mastery;
}

export function daysLeft(until: Date, now = new Date()): number {
  return Math.max(0, Math.ceil((until.getTime() - now.getTime()) / 86_400_000));
}

export const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
