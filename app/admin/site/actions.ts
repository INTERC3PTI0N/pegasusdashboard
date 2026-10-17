'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/access';
import { getDocDef } from '@/lib/site/schema';
import {
  saveDraft,
  publish,
  discardDraft,
  restoreToDraft,
  getAllDocStates,
  addMedia,
  deleteMedia,
  listMedia,
  mediaPath,
  updateLead,
  deleteLead,
  audit,
  type LeadStatus,
} from '@/lib/site/store';
import { revalidateSite } from '@/lib/site/remote';

type Result = { ok: true; message: string } | { ok: false; message: string };

function knownKey(key: string) {
  if (!getDocDef(key)) throw new Error('Unknown content block');
}

export async function saveDocDraft(key: string, data: unknown): Promise<Result> {
  const admin = await requireAdmin('site');
  knownKey(key);
  await saveDraft(key, data, admin.email);
  await audit(admin, 'site.save_draft', key);
  revalidatePath('/admin/site', 'layout');
  return { ok: true, message: 'Draft saved. Not live until you publish.' };
}

async function afterPublish(keys: string[]): Promise<string> {
  revalidatePath('/admin/site', 'layout');
  const refreshed = await revalidateSite();
  return refreshed
    ? `Published ${keys.length === 1 ? 'and live' : `${keys.length} blocks — live`} on the website now.`
    : `Published. The website picks it up within 5 minutes (couldn't reach it to refresh instantly).`;
}

export async function publishDoc(key: string, data?: unknown): Promise<Result> {
  const admin = await requireAdmin('site');
  knownKey(key);
  if (data !== undefined) await saveDraft(key, data, admin.email); // save + publish in one click
  if (!(await publish(key, admin.email))) return { ok: false, message: 'Nothing to publish — no unpublished changes.' };
  await audit(admin, 'site.publish', key);
  return { ok: true, message: await afterPublish([key]) };
}

export async function publishAllDrafts(): Promise<Result> {
  const admin = await requireAdmin('site');
  const drafts = (await getAllDocStates()).filter((d) => d.hasDraft).map((d) => d.key);
  if (drafts.length === 0) return { ok: false, message: 'There are no drafts to publish.' };
  for (const key of drafts) await publish(key, admin.email);
  await audit(admin, 'site.publish_all', drafts.join(', '), { count: drafts.length });
  return { ok: true, message: await afterPublish(drafts) };
}

export async function discardDocDraft(key: string): Promise<Result> {
  const admin = await requireAdmin('site');
  knownKey(key);
  await discardDraft(key);
  await audit(admin, 'site.discard_draft', key);
  revalidatePath('/admin/site', 'layout');
  return { ok: true, message: 'Draft discarded — showing the live version.' };
}

export async function restoreDocVersion(key: string, versionId: string): Promise<Result> {
  const admin = await requireAdmin('site');
  knownKey(key);
  if (versionId !== 'original' && !/^\d+$/.test(versionId)) return { ok: false, message: 'Unknown version.' };
  await restoreToDraft(key, versionId, admin.email);
  await audit(admin, 'site.restore_version', key, { version: versionId });
  revalidatePath('/admin/site', 'layout');
  return { ok: true, message: 'Loaded into the draft. Review it, then publish to make it live.' };
}

// ── Media ───────────────────────────────────────────────────────────────────

const MAX_UPLOAD = 4 * 1024 * 1024; // Vercel caps request bodies at 4.5 MB
const ALLOWED = /^(image\/(png|jpe?g|webp|gif|svg\+xml|avif)|video\/(mp4|webm))$/;

export async function uploadMedia(formData: FormData): Promise<{ ok: boolean; message: string; paths: string[] }> {
  const admin = await requireAdmin('site');
  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, message: 'Choose a file to upload.', paths: [] };

  const paths: string[] = [];
  const skipped: string[] = [];
  for (const file of files) {
    if (!ALLOWED.test(file.type) || file.size > MAX_UPLOAD) {
      skipped.push(file.name);
      continue;
    }
    const id = await addMedia(
      { filename: file.name.slice(0, 200), contentType: file.type, data: Buffer.from(await file.arrayBuffer()) },
      admin.email
    );
    paths.push(mediaPath(id));
    await audit(admin, 'media.upload', file.name, { id, size: file.size });
  }
  revalidatePath('/admin/media');
  const note = skipped.length ? ` Skipped ${skipped.join(', ')} (images or MP4/WebM up to 4 MB only).` : '';
  return { ok: paths.length > 0, message: `Uploaded ${paths.length} file${paths.length === 1 ? '' : 's'}.${note}`, paths };
}

export async function deleteMediaItem(id: string): Promise<Result> {
  const admin = await requireAdmin('site');
  const name = await deleteMedia(id);
  if (!name) return { ok: false, message: 'File not found.' };
  await audit(admin, 'media.delete', name, { id });
  revalidatePath('/admin/media');
  return { ok: true, message: `Deleted ${name}.` };
}

export async function listMediaForPicker() {
  await requireAdmin('site');
  return (await listMedia()).map((m) => ({ path: mediaPath(m.id), filename: m.filename, contentType: m.contentType }));
}

// ── Enquiries ───────────────────────────────────────────────────────────────

export async function saveLead(id: string, status: LeadStatus, notes: string): Promise<Result> {
  const admin = await requireAdmin('enquiries');
  if (!['new', 'contacted', 'closed'].includes(status)) return { ok: false, message: 'Invalid status.' };
  await updateLead(id, status, notes.slice(0, 4000));
  await audit(admin, 'lead.update', `lead #${id}`, { status });
  revalidatePath('/admin/enquiries');
  return { ok: true, message: 'Saved.' };
}

export async function removeLead(id: string): Promise<Result> {
  const admin = await requireAdmin('enquiries');
  await deleteLead(id);
  await audit(admin, 'lead.delete', `lead #${id}`);
  revalidatePath('/admin/enquiries');
  return { ok: true, message: 'Enquiry deleted.' };
}
