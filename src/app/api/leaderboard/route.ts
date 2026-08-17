import { NextResponse } from 'next/server';
import { getSnapshot, getEntries, upsertSnapshot } from '@/lib/leaderboard-db';

const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SNAPSHOT_LIMIT = 50;
const DIFFICULTIES = ['easy', 'normal', 'hard'];

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get('difficulty') || 'normal';
  const refresh = searchParams.get('refresh') === '1';

  if (!DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 });
  }

  const now = new Date();

  if (!refresh) {
    const snapshot = await getSnapshot(difficulty);

    if (snapshot && now.getTime() - new Date(snapshot.lastUpdatedAt).getTime() < SNAPSHOT_TTL_MS) {
      return NextResponse.json({
        difficulty,
        entries: JSON.parse(snapshot.entriesJson),
        lastUpdatedAt: snapshot.lastUpdatedAt,
        nextUpdateAt: new Date(new Date(snapshot.lastUpdatedAt).getTime() + SNAPSHOT_TTL_MS).toISOString(),
        cached: true,
      });
    }
  }

  const entries = await getEntries(difficulty, SNAPSHOT_LIMIT);
  const entriesJson = JSON.stringify(entries);

  await upsertSnapshot(difficulty, entriesJson, now.toISOString());

  return NextResponse.json({
    difficulty,
    entries,
    lastUpdatedAt: now.toISOString(),
    nextUpdateAt: new Date(now.getTime() + SNAPSHOT_TTL_MS).toISOString(),
    cached: false,
  });
}