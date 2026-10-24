import 'server-only';
import { db } from '@/lib/db';
import { docs, getDocDef, sanitize, siteDefaults, type Content } from './schema';

export interface DocState {
  key: string;
  /** What the editor shows: draft, else published, else the site's original copy. */
  content: Content;
  hasDraft: boolean;
  isPublished: boolean; // false = the site is still showing its built-in defaults
  updatedAt: Date | null;
  updatedBy: string | null;
  publishedAt: Date | null;
  publishedBy: string | null;
}

interface Row {
  key: string;
  draft: Content | null;
  published: Content | null;
  updatedAt: Date | null;
  updatedBy: string | null;
  publishedAt: Date | null;
  publishedBy: string | null;
}

function toState(key: string, row?: Row): DocState {
  return {
    key,
    // Over the defaults, so fields added after a block was saved still show their default.
    content: { ...siteDefaults[key], ...(row?.draft ?? row?.published ?? {}) },
    hasDraft: !!row?.draft,
    isPublished: !!row?.published,
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedBy ?? null,
    publishedAt: row?.publishedAt ?? null,
    publishedBy: row?.publishedBy ?? null,
  };
}

export async function getAllDocStates(): Promise<DocState[]> {
  const rows = await db()<Row[]>`select * from site_content`;
  return docs.map((d) => toState(d.key, rows.find((r) => r.key === d.key)));
}

export async function getDocState(key: string): Promise<DocState> {
  const [row] = await db()<Row[]>`select * from site_content where key = ${key}`;
  return toState(key, row);
}

/** Everything the public site renders. `draft` = preview mode: drafts layered over live content. */
export async function getSiteContent(draft = false): Promise<Record<string, Content>> {
  const rows = await db()<Row[]>`select key, draft, published from site_content`;
  return Object.fromEntries(
    docs.map((d) => {
      const row = rows.find((r) => r.key === d.key);
      return [d.key, { ...siteDefaults[d.key], ...((draft && row?.draft) || row?.published || {}) }];
    })
  );
}

export async function saveDraft(key: string, data: unknown, actor: string): Promise<void> {
  const def = getDocDef(key);
  if (!def) throw new Error(`Unknown content block ${key}`);
  const clean = sanitize(def.fields, data);
  await db()`
    insert into site_content (key, draft, updated_at, updated_by)
    values (${key}, ${db().json(clean as never)}, now(), ${actor})
    on conflict (key) do update set draft = excluded.draft, updated_at = now(), updated_by = excluded.updated_by`;
}

/** Publishes the draft (if any) and records a version. Returns false when there was nothing to publish. */
export async function publish(key: string, actor: string): Promise<boolean> {
  return db().begin(async (tx) => {
    const [row] = await tx<{ draft: Content | null }[]>`select draft from site_content where key = ${key} for update`;
    if (!row?.draft) return false;
    await tx`
      update site_content set published = draft, draft = null, published_at = now(), published_by = ${actor}
      where key = ${key}`;
    await tx`insert into site_content_versions (key, data, published_by) values (${key}, ${tx.json(row.draft as never)}, ${actor})`;
    return true;
  });
}

export async function discardDraft(key: string): Promise<void> {
  await db()`update site_content set draft = null where key = ${key}`;
}

export interface Version {
  id: string;
  publishedAt: Date;
  publishedBy: string | null;
}

export async function getVersions(key: string): Promise<Version[]> {
  return db()<Version[]>`
    select id, published_at, published_by from site_content_versions
    where key = ${key} order by published_at desc limit 50`;
}

/** Loads an old version (or the original site copy) into the draft, for review before publishing. */
export async function restoreToDraft(key: string, versionId: string | 'original', actor: string): Promise<void> {
  let data: Content | undefined;
  if (versionId === 'original') data = siteDefaults[key];
  else {
    const [v] = await db()<{ data: Content }[]>`
      select data from site_content_versions where id = ${versionId}::bigint and key = ${key}`;
    data = v?.data;
  }
  if (!data) throw new Error('Version not found');
  await saveDraft(key, data, actor);
}

// ── Media library ───────────────────────────────────────────────────────────

export interface MediaItem {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: Date;
  uploadedBy: string | null;
}

/** Public sites reference uploads through their own /cms-media/<id> rewrite to this app. */
export const mediaPath = (id: string) => `/cms-media/${id}`;

export async function listMedia(): Promise<MediaItem[]> {
  return db()<MediaItem[]>`
    select id, filename, content_type, size, created_at, uploaded_by from media order by created_at desc`;
}

export async function addMedia(file: { filename: string; contentType: string; data: Buffer }, actor: string) {
  const [row] = await db()<{ id: string }[]>`
    insert into media (filename, content_type, size, data, uploaded_by)
    values (${file.filename}, ${file.contentType}, ${file.data.length}, ${file.data}, ${actor})
    returning id`;
  return row.id;
}

export async function getMediaFile(id: string) {
  const [row] = await db()<{ contentType: string; data: Buffer }[]>`select content_type, data from media where id = ${id}`;
  return row ?? null;
}

export async function deleteMedia(id: string): Promise<string | null> {
  const [row] = await db()<{ filename: string }[]>`delete from media where id = ${id} returning filename`;
  return row?.filename ?? null;
}

// ── Enquiries from the public site ─────────────────────────────────────────

export type LeadKind = 'brochure' | 'dealer' | 'business';
export type LeadStatus = 'new' | 'contacted' | 'closed';

export interface Lead {
  id: string;
  kind: LeadKind;
  name: string;
  email: string;
  company: string;
  country: string;
  role: string;
  interest: string;
  message: string;
  marketingConsent: boolean;
  status: LeadStatus;
  notes: string;
  createdAt: Date;
}

export async function addLead(lead: Omit<Lead, 'id' | 'status' | 'notes' | 'createdAt'>) {
  await db()`
    insert into leads (kind, name, email, company, country, role, interest, message, marketing_consent)
    values (${lead.kind}, ${lead.name}, ${lead.email}, ${lead.company}, ${lead.country}, ${lead.role},
            ${lead.interest}, ${lead.message}, ${lead.marketingConsent})`;
}

export async function getLeads(): Promise<Lead[]> {
  return db()<Lead[]>`select * from leads order by created_at desc limit 2000`;
}

export async function updateLead(id: string, status: LeadStatus, notes: string) {
  await db()`update leads set status = ${status}, notes = ${notes} where id = ${id}::bigint`;
}

export async function deleteLead(id: string) {
  await db()`delete from leads where id = ${id}::bigint`;
}

// ── Audit log ───────────────────────────────────────────────────────────────

export async function audit(actor: { id: string; email: string }, action: string, target: string, details?: object) {
  await db()`
    insert into audit_log (actor_id, actor_email, action, target, details)
    values (${actor.id}, ${actor.email}, ${action}, ${target}, ${details ? db().json(details as never) : null})`;
}

export interface AuditEntry {
  id: string;
  actorEmail: string | null;
  action: string;
  target: string | null;
  details: Record<string, unknown> | null;
  at: Date;
}

export async function getAuditLog(limit = 500): Promise<AuditEntry[]> {
  return db()<AuditEntry[]>`
    select id, actor_email, action, target, details, at from audit_log order by at desc limit ${limit}`;
}
