import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FALLBACK_RATE = 26.37;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes (rates update every ~30 min)
const ZIMRATE_WIDGET_URL = 'https://zimrate.com/api/widget/rates';

interface CacheEntry {
  rate: number;
  buyRate: number | null;
  sellRate: number | null;
  source: string;
  scrapedAt: string | null;
  fetchedAt: string;
  fallback: boolean;
}

let cache: CacheEntry | null = null;

async function fetchLiveRate(): Promise<CacheEntry> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(ZIMRATE_WIDGET_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`zimrate responded ${res.status}`);

    const data = (await res.json()) as Array<{
      source: string;
      type: string;
      buy: string;
      sell: string;
    }>;

    const official = (data || []).find(
      (r) => (r.type || '').toLowerCase().startsWith('official') && r.buy && r.buy !== '-'
    );

    if (!official) throw new Error('no official rate in response');

    const buy = parseFloat(official.buy);
    const sell = official.sell && official.sell !== '-' ? parseFloat(official.sell) : null;
    const rate = sell ? (buy + sell) / 2 : buy;

    return {
      rate,
      buyRate: buy,
      sellRate: sell,
      source: official.source,
      scrapedAt: null,
      fetchedAt: new Date().toISOString(),
      fallback: false,
    };
  } catch (err) {
    return {
      rate: FALLBACK_RATE,
      buyRate: FALLBACK_RATE,
      sellRate: null,
      source: 'fallback',
      scrapedAt: null,
      fetchedAt: new Date().toISOString(),
      fallback: true,
    };
  }
}

export async function GET() {
  const now = Date.now();
  if (cache && now - new Date(cache.fetchedAt).getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache, cached: true });
  }

  const entry = await fetchLiveRate();
  cache = entry;

  return NextResponse.json({ ...entry, cached: false });
}