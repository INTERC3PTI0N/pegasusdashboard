import fs from 'fs';
import path from 'path';

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  salon: string;
  productSlug: string;
  productName: string;
  issuedAt: string; // ISO date
}

interface StoreData {
  /** userId -> productSlug -> completed lesson ids */
  progress: Record<string, Record<string, string[]>>;
  certificates: Certificate[];
}

const STORE_PATH = path.join(process.cwd(), 'data', 'store.json');

function readStore(): StoreData {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw) as StoreData;
  } catch {
    return { progress: {}, certificates: [] };
  }
}

function writeStore(data: StoreData) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function getCompletedLessons(userId: string, productSlug: string): string[] {
  const store = readStore();
  return store.progress[userId]?.[productSlug] ?? [];
}

export function getAllProgress(userId: string): Record<string, string[]> {
  const store = readStore();
  return store.progress[userId] ?? {};
}

export function setLessonComplete(
  userId: string,
  productSlug: string,
  lessonId: string,
  complete: boolean
) {
  const store = readStore();
  store.progress[userId] ??= {};
  const current = new Set(store.progress[userId][productSlug] ?? []);
  if (complete) current.add(lessonId);
  else current.delete(lessonId);
  store.progress[userId][productSlug] = [...current];
  writeStore(store);
}

/** Admin: full progress map for every user. */
export function getEveryonesProgress(): Record<string, Record<string, string[]>> {
  return readStore().progress;
}

/** Admin: every certificate ever issued. */
export function getAllCertificates(): Certificate[] {
  return readStore().certificates;
}

export function getCertificates(userId: string): Certificate[] {
  return readStore().certificates.filter((c) => c.userId === userId);
}

export function findCertificate(id: string): Certificate | undefined {
  return readStore().certificates.find((c) => c.id === id);
}

export function findCertificateFor(userId: string, productSlug: string): Certificate | undefined {
  return readStore().certificates.find(
    (c) => c.userId === userId && c.productSlug === productSlug
  );
}

export function issueCertificate(cert: Omit<Certificate, 'id' | 'issuedAt'>): Certificate {
  const store = readStore();
  const existing = store.certificates.find(
    (c) => c.userId === cert.userId && c.productSlug === cert.productSlug
  );
  if (existing) return existing;

  const id = `PGS-${cryptoRandom(4)}-${cryptoRandom(4)}`.toUpperCase();
  const issued: Certificate = { ...cert, id, issuedAt: new Date().toISOString() };
  store.certificates.push(issued);
  writeStore(store);
  return issued;
}

function cryptoRandom(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}
