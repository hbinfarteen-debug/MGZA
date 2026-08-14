// ═══════════════════════════════════════════════════════
// MAKE GREAT ZIMBABWE AGAIN - Leaderboard SQLite store
// Uses bun:sqlite (the bun dev/prod runtime). Loaded lazily
// to avoid bundler/runtime resolution conflicts.
// File lives in db/leaderboard.db next to the app data.
// ═══════════════════════════════════════════════════════

import path from 'node:path';

const DB_PATH =
  process.env.LEADERBOARD_DB_PATH ||
  path.join(process.cwd(), 'db', 'leaderboard.db');

type SqlStatement = {
  run(...params: (string | number)[]): unknown;
  all(...params: (string | number)[]): Record<string, any>[];
  get(...params: (string | number)[]): Record<string, any> | undefined;
};

type SqlDb = {
  exec(sql: string): void;
  prepare(sql: string): SqlStatement;
};

interface BunSqliteModule {
  Database: new (path: string) => {
    exec(sql: string): void;
    prepare(sql: string): SqlStatement;
  };
}

let db: SqlDb | null = null;

function getDb(): SqlDb {
  if (db) return db;

  // Deliberately opaque: keep 'bun:sqlite' out of the bundler's
  // static import graph; evaluate it from the runtime instead.
  const driverPath = ['bun', 'sqlite'].join(':');
  const driverModule = moduleRequire(driverPath) as BunSqliteModule;

  if (!driverModule || !driverModule.Database) {
    throw new Error('bun:sqlite driver unavailable');
  }

  const Database = driverModule.Database;
  db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard_entries (
      id TEXT PRIMARY KEY,
      player_name TEXT NOT NULL,
      score REAL NOT NULL,
      popularity REAL NOT NULL,
      satisfaction REAL NOT NULL,
      legitimacy REAL NOT NULL,
      gdp REAL NOT NULL,
      years_in_office REAL NOT NULL,
      turns_survived INTEGER NOT NULL,
      population INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
      difficulty TEXT PRIMARY KEY,
      entries_json TEXT NOT NULL,
      last_updated_at TEXT NOT NULL
    );
  `);

  return db;
}

function moduleRequire(specifier: string): unknown {
  const req = getRuntimeRequire();
  return req(specifier);
}

function getRuntimeRequire(): (specifier: string) => unknown {
  // Turbopack compiles CJS-ish output where `require` remains
  // usable at runtime; fall back to globalThis-based loading.
  const globalAny = globalThis as any;
  if (typeof globalAny.require === 'function') return globalAny.require;
  const req = eval('require');
  if (typeof req === 'function') return req;
  throw new Error('No require available');
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

export function insertEntry(entry: Omit<LeaderboardRow, 'id' | 'createdAt'> & { id?: string }): LeaderboardRow {
  const handle = getDb();
  const id = entry.id || `lb_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  const createdAt = new Date().toISOString();

  handle
    .prepare(
      `INSERT INTO leaderboard_entries
        (id, player_name, score, popularity, satisfaction, legitimacy, gdp, years_in_office, turns_survived, population, difficulty, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      entry.playerName,
      entry.score,
      entry.popularity,
      entry.satisfaction,
      entry.legitimacy,
      entry.gdp,
      entry.yearsInOffice,
      entry.turnsSurvived,
      entry.population,
      entry.difficulty,
      createdAt
    );

  return { ...entry, id, createdAt } as LeaderboardRow;
}

export function getEntries(difficulty: string, limit = 50): LeaderboardRow[] {
  const handle = getDb();
  const rows = handle
    .prepare(
      `SELECT id, player_name, score, popularity, satisfaction, legitimacy, gdp, years_in_office, turns_survived, population, difficulty, created_at
       FROM leaderboard_entries
       WHERE difficulty = ?
       ORDER BY score DESC, created_at ASC
       LIMIT ?`
    )
    .all(difficulty, limit);

  return rows.map(mapRow);
}

export function countHigherScorers(difficulty: string, score: number, createdAt: string): number {
  const handle = getDb();
  const row = handle
    .prepare(
      `SELECT COUNT(*) AS c
       FROM leaderboard_entries
       WHERE difficulty = ? AND (score > ? OR (score = ? AND created_at < ?))`
    )
    .get(difficulty, score, score, createdAt);
  return Number(row?.c || 0);
}

export function getSnapshot(difficulty: string): SnapshotRow | null {
  const handle = getDb();
  const row = handle
    .prepare('SELECT difficulty, entries_json, last_updated_at FROM leaderboard_snapshots WHERE difficulty = ?')
    .get(difficulty);
  return row
    ? {
        difficulty,
        entriesJson: String(row.entries_json),
        lastUpdatedAt: String(row.last_updated_at),
      }
    : null;
}

export function upsertSnapshot(difficulty: string, entriesJson: string, lastUpdatedAt: string): void {
  const handle = getDb();
  handle
    .prepare(
      `INSERT INTO leaderboard_snapshots (difficulty, entries_json, last_updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(difficulty) DO UPDATE SET entries_json = excluded.entries_json, last_updated_at = excluded.last_updated_at`
    )
    .run(difficulty, entriesJson, lastUpdatedAt);
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