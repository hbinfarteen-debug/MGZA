import { NextResponse } from 'next/server';
import { insertEntry, countHigherScorers } from '@/lib/leaderboard-db';

export const dynamic = 'force-dynamic';

const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
const MAX_NAME_LENGTH = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { playerName, difficulty } = body;

    if (!DIFFICULTIES.includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 });
    }

    const cleanName = String(playerName || '').trim().slice(0, MAX_NAME_LENGTH);
    if (!cleanName) {
      return NextResponse.json({ error: 'Player name required' }, { status: 400 });
    }

    const fields: [string, number, number, number, number, number] = [
      'score',
      'popularity',
      'satisfaction',
      'legitimacy',
      'gdp',
      'yearsInOffice',
    ];

    const parsed: Record<string, number> = {};
    for (const key of fields) {
      const value = Number(body[key]);
      parsed[key] = Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;
    }

    const entry = insertEntry({
      playerName: cleanName,
      difficulty,
      score: parsed.score,
      popularity: parsed.popularity,
      satisfaction: parsed.satisfaction,
      legitimacy: parsed.legitimacy,
      gdp: parsed.gdp,
      yearsInOffice: parsed.yearsInOffice,
      turnsSurvived: Math.max(0, Math.round(Number(body.turnsSurvived) || 0)),
      population: Math.round(Number(body.population) || 0),
    });

    const rank = countHigherScorers(difficulty, entry.score, entry.createdAt) + 1;

    return NextResponse.json({ entry: entry.id, rank });
  } catch (err) {
    console.error('Leaderboard submit failed', err);
    return NextResponse.json({ error: 'Submit failed' }, { status: 500 });
  }
}