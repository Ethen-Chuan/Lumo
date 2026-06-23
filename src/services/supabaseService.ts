/**
 * Lumo Supabase Service
 *
 * Provides cloud sync for sources, highlights, notes, claims, evidence,
 * insights, and deliverables. Auth via Supabase magic-link email.
 *
 * === SETUP GUIDE ===
 * 1. Create a free project at https://supabase.com
 * 2. Copy your Project URL and anon key from Settings → API
 * 3. Add to .env.local (or Settings → Cloud Sync in the app):
 *
 *    VITE_SUPABASE_URL=https://xxxx.supabase.co
 *    VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *
 * 4. Run the SQL schema (supabase/schema.sql) in the Supabase SQL editor
 * 5. That's it — the app will auto-sync on every state change.
 * ==================
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────

const SB_URL_KEY = "lumo-supabase-url";
const SB_KEY_KEY = "lumo-supabase-anon-key";

export function getSupabaseConfig(): { url: string; anonKey: string } {
  return {
    url:
      localStorage.getItem(SB_URL_KEY) ||
      (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL ||
      "",
    anonKey:
      localStorage.getItem(SB_KEY_KEY) ||
      (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY ||
      "",
  };
}

export function setSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(SB_URL_KEY, url);
  localStorage.setItem(SB_KEY_KEY, anonKey);
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

let _client: SupabaseClient | null = null;

export function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  _client = createClient(url, anonKey);
  return _client;
}

// ── Auth ─────────────────────────────────────────────────

export async function signInWithEmail(email: string): Promise<{ error: string | null }> {
  const client = getClient();
  if (!client) return { error: "Supabase not configured" };
  const { error } = await client.auth.signInWithOtp({ email });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  const client = getClient();
  if (client) await client.auth.signOut();
}

export async function getCurrentUser() {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
}

// ── Sync: push local state to Supabase ────────────────────

export async function pushToCloud(
  table: string,
  items: Array<{ id: string } & Record<string, unknown>>,
  userId: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  if (!items.length) return;
  const rows = items.map((item) => ({ ...item, user_id: userId }));
  await client.from(table).upsert(rows, { onConflict: "id" });
}

export async function pullFromCloud(
  table: string,
  userId: string,
): Promise<Array<Record<string, unknown>>> {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client.from(table).select("*").eq("user_id", userId);
  if (error) { console.error(`[Lumo Supabase] pull ${table}:`, error); return []; }
  return data ?? [];
}

/** Full sync: push the local Zustand state to Supabase */
export async function syncToSupabase(state: {
  sources: unknown[];
  highlights: unknown[];
  notes: unknown[];
  claims: unknown[];
  evidence: unknown[];
  insights: unknown[];
  deliverables: unknown[];
  projects: unknown[];
  collections: unknown[];
}): Promise<void> {
  const client = getClient();
  if (!client) return;
  const user = await getCurrentUser();
  if (!user) return;
  const uid = user.id;
  const tables = [
    ["lumo_sources", state.sources],
    ["lumo_highlights", state.highlights],
    ["lumo_notes", state.notes],
    ["lumo_claims", state.claims],
    ["lumo_evidence", state.evidence],
    ["lumo_insights", state.insights],
    ["lumo_deliverables", state.deliverables],
    ["lumo_projects", state.projects],
    ["lumo_collections", state.collections],
  ] as const;
  await Promise.all(
    tables.map(([table, items]) =>
      pushToCloud(table, items as Array<{ id: string } & Record<string, unknown>>, uid)
    )
  );
}

/** Pull all data from Supabase and return as a merged state patch */
export async function pullFromSupabase(): Promise<{
  sources?: unknown[];
  highlights?: unknown[];
  notes?: unknown[];
  claims?: unknown[];
  evidence?: unknown[];
  insights?: unknown[];
  deliverables?: unknown[];
  projects?: unknown[];
  collections?: unknown[];
} | null> {
  const client = getClient();
  if (!client) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const uid = user.id;
  const [sources, highlights, notes, claims, evidence, insights, deliverables, projects, collections] =
    await Promise.all([
      pullFromCloud("lumo_sources", uid),
      pullFromCloud("lumo_highlights", uid),
      pullFromCloud("lumo_notes", uid),
      pullFromCloud("lumo_claims", uid),
      pullFromCloud("lumo_evidence", uid),
      pullFromCloud("lumo_insights", uid),
      pullFromCloud("lumo_deliverables", uid),
      pullFromCloud("lumo_projects", uid),
      pullFromCloud("lumo_collections", uid),
    ]);
  return { sources, highlights, notes, claims, evidence, insights, deliverables, projects, collections };
}
