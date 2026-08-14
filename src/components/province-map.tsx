'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import type { Province } from '@/lib/game/types';
import { useTranslation } from '@/hooks/useTranslation';
import { spring } from '@/lib/motion';
import geo from '@/lib/geo/zimbabwe-adm1';

type MetricId =
  | 'support'
  | 'happy'
  | 'poverty'
  | 'infrastructure'
  | 'health'
  | 'education'
  | 'safety'
  | 'urban'
  | 'unemployment';

type MetricDef = {
  id: MetricId;
  key: string;
  get: (p: Province) => number;
  invert?: boolean;
};

const METRIC_DEFS: MetricDef[] = [
  { id: 'support', key: 'map.support', get: (p) => p.politicalSupport },
  { id: 'happy', key: 'map.happy', get: (p) => p.satisfactionIndex },
  { id: 'poverty', key: 'map.poverty', get: (p) => p.povertyRate, invert: true },
  { id: 'infrastructure', key: 'map.infrastructure', get: (p) => p.infrastructureIndex },
  { id: 'health', key: 'map.health', get: (p) => p.healthIndex },
  { id: 'education', key: 'map.education', get: (p) => p.educationIndex },
  { id: 'safety', key: 'map.safety', get: (p) => p.safetyIndex },
  { id: 'urban', key: 'map.urban', get: (p) => p.urbanization },
  { id: 'unemployment', key: 'map.unemployment', get: (p) => p.unemploymentRate, invert: true },
];

const NAME_MAP: Record<string, string> = {
  Bulawayo: 'Bulawayo Metropolitan',
  Harare: 'Harare Metropolitan',
};

type GeoRing = number[][];
type GeoPoly = GeoRing[];
type GeoFeature = {
  properties: { name: string };
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: GeoPoly | GeoPoly[] };
};

const GEO = geo as unknown as { type: string; features: GeoFeature[] };

function coordsOf(f: GeoFeature): GeoPoly[] {
  return f.geometry.type === 'Polygon'
    ? [f.geometry.coordinates as GeoPoly]
    : (f.geometry.coordinates as GeoPoly[]);
}

const { minLon, maxLon, minLat, maxLat } = (() => {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const f of GEO.features) {
    for (const poly of coordsOf(f)) {
      for (const ring of poly) {
        for (const [lon, lat] of ring) {
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
    }
  }
  return { minLon, maxLon, minLat, maxLat };
})();

const K = 520;
const PAD = 6;

function ringPath(ring: number[][]): string {
  const pts = ring.map(
    ([lon, lat]) => [(lon - minLon) * K + PAD, (maxLat - lat) * K + PAD] as const
  );
  return (
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join('') + 'Z'
  );
}

type ProvinceShapes = string[];

const SHAPES_CACHE = new Map<string, ProvinceShapes>();

function getShapes(gameName: string): ProvinceShapes | undefined {
  const cached = SHAPES_CACHE.get(gameName);
  if (cached) return cached;
  const feat = GEO.features.find(
    (f) => NAME_MAP[f.properties.name] === gameName || f.properties.name === gameName
  );
  if (!feat) return undefined;
  const paths: ProvinceShapes = [];
  for (const poly of coordsOf(feat)) {
    const outer = poly[0];
    if (!outer || outer.length < 3) continue;
    paths.push(ringPath(outer));
  }
  SHAPES_CACHE.set(gameName, paths);
  return paths;
}

const VIEW_W = (maxLon - minLon) * K + PAD * 2;
const VIEW_H = (maxLat - minLat) * K + PAD * 2;

const RAMP = [
  { v: 0, c: '#4B463F' },
  { v: 45, c: '#6E5F3F' },
  { v: 75, c: '#A67C2E' },
  { v: 100, c: '#E8A817' },
];

function rampHex(v: number): string {
  if (v <= RAMP[0].v) return RAMP[0].c;
  for (let i = 1; i < RAMP.length; i++) {
    const lo = RAMP[i - 1];
    const hi = RAMP[i];
    if (v <= hi.v) {
      const f = (v - lo.v) / (hi.v - lo.v);
      const a = parseInt(lo.c.slice(1), 16);
      const b = parseInt(hi.c.slice(1), 16);
      const ar = (a >> 16) & 255;
      const ag = (a >> 8) & 255;
      const ab = a & 255;
      const br = (b >> 16) & 255;
      const bg = (b >> 8) & 255;
      const bb = b & 255;
      const r = Math.round(ar + (br - ar) * f);
      const g = Math.round(ag + (bg - ag) * f);
      const bl = Math.round(ab + (bb - ab) * f);
      return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
    }
  }
  return RAMP[RAMP.length - 1].c;
}

const LEGEND_GRADIENT = `linear-gradient(to right, ${RAMP.map((r) => r.c).join(', ')})`;

const DIM_COLOR = '#1B1916';
const HOVER_COLOR = '#FFD76A';

function mixHex(a: string, b: string, f: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255;
  const ag = (pa >> 8) & 255;
  const ab = pa & 255;
  const br = (pb >> 16) & 255;
  const bg = (pb >> 8) & 255;
  const bb = pb & 255;
  const r = Math.round(ar + (br - ar) * f);
  const g = Math.round(ag + (bg - ag) * f);
  const bl = Math.round(ab + (bb - ab) * f);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

type TipPoint = { x: number; y: number };

type ProvinceMapProps = {
  provinces: Province[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export default function ProvinceMap({ provinces, selectedId, onSelect }: ProvinceMapProps) {
  const { t } = useTranslation();
  const [metricId, setMetricId] = useState<MetricId>('support');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(() => selectedId);
  const [tip, setTip] = useState<TipPoint | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const metricDef = METRIC_DEFS.find((m) => m.id === metricId) ?? METRIC_DEFS[0];
  const activeId = hoveredId ?? pinnedId;
  const activeProvince = activeId ? provinces.find((p) => p.id === activeId) : undefined;

  const clampTip = useCallback((e: { clientX: number; clientY: number }): TipPoint => {
    const el = boxRef.current;
    const rect = el?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x: Math.min(Math.max(x + 14, 8), rect.width - 248),
      y: y < 200 ? y + 26 : y - 196,
    };
  }, []);

  const handleHover = useCallback(
    (id: string, e: { clientX: number; clientY: number }) => {
      setHoveredId(id);
      setTip(clampTip(e));
    },
    [clampTip]
  );

  const handleMove = useCallback(
    (e: { clientX: number; clientY: number }) => {
      setTip(clampTip(e));
    },
    [clampTip]
  );

  const handleOut = useCallback(() => {
    setHoveredId(null);
  }, []);

  const handleClick = useCallback(
    (id: string) => {
      setPinnedId((prev) => {
        const next = prev === id ? null : id;
        onSelect(next);
        return next;
      });
    },
    [onSelect]
  );

  const handleBackgroundClick = useCallback(() => {
    setPinnedId(null);
    setHoveredId(null);
    setTip(null);
    onSelect(null);
  }, [onSelect]);

  const dimActive = hoveredId !== null || pinnedId !== null;

  return (
    <MotionConfig reducedMotion="user">
      <div ref={boxRef} className="relative">
        <div className="relative h-[420px] sm:h-[520px] overflow-hidden rounded-lg border border-border bg-background/40">
          <svg
            viewBox={`0 0 ${VIEW_W.toFixed(1)} ${VIEW_H.toFixed(1)}`}
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            onClick={handleBackgroundClick}
            style={{ filter: 'drop-shadow(0 8px 14px rgba(0, 0, 0, 0.35))' }}
          >
            {provinces.map((p) => {
              const shapes = getShapes(p.name);
              if (!shapes) return null;
              const isHovered = hoveredId === p.id;
              const isPinned = pinnedId === p.id;
              const isActive = isHovered || isPinned;
              const dimmed = dimActive && !isActive;
              const norm = metricDef.invert ? 100 - metricDef.get(p) : metricDef.get(p);
              let fill = rampHex(norm);
              if (dimmed) fill = mixHex(fill, DIM_COLOR, 0.55);
              if (isHovered) fill = mixHex(fill, HOVER_COLOR, 0.4);
              else if (isPinned) fill = mixHex(fill, HOVER_COLOR, 0.22);
              return (
                <g
                  key={p.id}
                  className="cursor-pointer"
                  style={{ transition: 'fill 150ms ease' }}
                  onMouseEnter={(e) => handleHover(p.id, e)}
                  onMouseMove={handleMove}
                  onMouseLeave={handleOut}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick(p.id);
                  }}
                >
                  {shapes.map((d, i) => (
                    <path
                      key={i}
                      d={d}
                      fill={fill}
                      stroke={isActive ? '#FFD76A' : '#101319'}
                      strokeWidth={isActive ? 2 : 1}
                      strokeLinejoin="round"
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          <AnimatePresence>
            {activeProvince && tip && (
              <motion.div
                key="province-tip"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
                transition={spring.entrance()}
                className="pointer-events-none absolute z-20 w-[240px] rounded-lg border border-border bg-card/95 p-4 shadow-xl backdrop-blur"
                style={{ left: tip.x, top: tip.y }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="min-w-0 truncate text-sm font-bold">{activeProvince.name}</h4>
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.625rem] text-amber-400">
                    {t(metricDef.key)}
                  </span>
                </div>
                <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-1.5 text-[0.875rem]">
                  {[
                    { key: 'map.pop', value: `${(activeProvince.population / 1e6).toFixed(1)}M` },
                    { key: 'map.urban', value: `${activeProvince.urbanization.toFixed(0)}%` },
                    { key: 'map.support', value: `${activeProvince.politicalSupport.toFixed(0)}%` },
                    { key: 'map.happy', value: `${activeProvince.satisfactionIndex.toFixed(0)}%` },
                    { key: 'map.health', value: activeProvince.healthIndex.toFixed(0) },
                    { key: 'map.education', value: activeProvince.educationIndex.toFixed(0) },
                    { key: 'map.infrastructure', value: activeProvince.infrastructureIndex.toFixed(0) },
                    { key: 'map.safety', value: activeProvince.safetyIndex.toFixed(0) },
                    { key: 'map.poverty', value: `${activeProvince.povertyRate.toFixed(0)}%` },
                    { key: 'map.unemployment', value: `${activeProvince.unemploymentRate.toFixed(0)}%` },
                    { key: 'map.agriculture', value: String(activeProvince.agriculturalOutput) },
                    { key: 'map.mining', value: String(activeProvince.miningOutput) },
                  ].map((row) => (
                    <div
                      key={row.key}
                      className={`flex min-w-0 items-center justify-between gap-2 ${
                        row.key === metricDef.key ? 'text-amber-400' : 'text-muted-foreground'
                      }`}
                    >
                      <span className="min-w-0 truncate">{t(row.key)}</span>
                      <span className="shrink-0 font-bold text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          {METRIC_DEFS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetricId(m.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[0.6875rem] uppercase tracking-wide transition-colors ${
                metricId === m.id
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-400'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(m.key)}
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-[0.625rem] text-muted-foreground">{t('map.low')}</span>
          <div className="h-1.5 flex-1 rounded-full" style={{ background: LEGEND_GRADIENT }} />
          <span className="text-[0.625rem] text-muted-foreground">{t('map.high')}</span>
          <span className="ml-2 text-[0.625rem] text-muted-foreground">{t('map.elevation')}</span>
        </div>

        <div className="mt-1 text-[0.625rem] text-muted-foreground/70">{t('map.hint')}</div>
      </div>
    </MotionConfig>
  );
}