// ═══════════════════════════════════════════════════════
// MAKE GREAT ZIMBABWE AGAIN - Leaderboard Supabase store
// Replaces the old bun:sqlite store (db/leaderboard.db).
// Uses @supabase/supabase-js with the anon publishable key;
// RLS policies in supabase/schema.sql allow public reads and
// inserts, so the app's API routes can read/write directly.
// ═══════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase not configured: SUPABASE_URL and SUPABASE_ANON_KEY required');
  }

  client = createClient(url, key);
  return client;
}

export interface LeaderboardRow {
  id: string;
  playerName: string;
  score: number;
  popularity: number;
  satisfaction: number;
  legitimacy: number;
  gdp: number;
  yearsInOffice: number;
  turnsSurvived: number;
  population: number;
  difficulty: string;
  createdAt: string;
}

export interface SnapshotRow {
  difficulty: string;
  entriesJson: string;
  lastUpdatedAt: string;
}

interface EntryInsert {
  id?: string;
  playerName: string;
  score: number;
  popularity: number;
  satisfaction: number;
  legitimacy: number;
  gdp: number;
  yearsInOffice: number;
  turnsSurvived: number;
  population: number;
  difficulty: string;
}

export async function insertEntry(entry: EntryInsert): Promise<LeaderboardRow> {
  const supabase = getClient();
  const id = entry.id || `lb_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  const createdAt = new Date().toISOString();

  const { error } = await supabase
    .from('leaderboard_entries')
    .insert({
      id,
      player_name: entry.playerName,
      score: entry.score,
      popularity: entry.popularity,
      satisfaction: entry.satisfaction,
      legitimacy: entry.legitimacy,
      gdp: entry.gdp,
      years_in_office: entry.yearsInOffice,
      turns_survived: entry.turnsSurvived,
      population: entry.population,
      difficulty: entry.difficulty,
      created_at: createdAt,
    });

  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return { ...entry, id, createdAt } as LeaderboardRow;
}

export async function getEntries(difficulty: string, limit = 50): Promise<LeaderboardRow[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('*')
    .eq('difficulty', difficulty)
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Supabase select failed: ${error.message}`);
  }

  return (data || []).map(mapRow);
}

export async function countHigherScorers(difficulty: string, score: number, createdAt: string): Promise<number> {
  const supabase = getClient();

  const { count, error } = await supabase
    .from('leaderboard_entries')
    .select('*', { count: 'exact', head: true })
    .eq('difficulty', difficulty)
    .or(`score.gt.${score},and(score.eq.${score},created_at.lt.${createdAt})`);

  if (error) {
    throw new Error(`Supabase count failed: ${error.message}`);
  }

  return count || 0;
}

export async function getSnapshot(difficulty: string): Promise<SnapshotRow | null> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('leaderboard_snapshots')
    .select('*')
    .eq('difficulty', difficulty)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase snapshot select failed: ${error.message}`);
  }

  return data
    ? {
        difficulty,
        entriesJson: String(data.entries_json),
        lastUpdatedAt: String(data.last_updated_at),
      }
    : null;
}

export async function upsertSnapshot(difficulty: string, entriesJson: string, lastUpdatedAt: string): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase
    .from('leaderboard_snapshots')
    .upsert(
      { difficulty, entries_json: entriesJson, last_updated_at: lastUpdatedAt },
      { onConflict: 'difficulty' }
    );

  if (error) {
    throw new Error(`Supabase snapshot upsert failed: ${error.message}`);
  }
}

function mapRow(row: Record<string, any>): LeaderboardRow {
  return {
    id: String(row.id),
    playerName: String(row.player_name),
    score: Number(row.score),
    popularity: Number(row.popularity),
    satisfaction: Number(row.satisfaction),
    legitimacy: Number(row.legitimacy),
    gdp: Number(row.gdp),
    yearsInOffice: Number(row.years_in_office),
    turnsSurvived: Number(row.turns_survived),
    population: Number(row.population),
    difficulty: String(row.difficulty),
    createdAt: String(row.created_at),
  };
}