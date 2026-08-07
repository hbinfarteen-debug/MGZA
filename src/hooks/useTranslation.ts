'use client';

import { useGameStore } from '@/store/game-store';
import { t as translate, getGameTip, type Language } from '@/lib/i18n';

export function useTranslation() {
  const language = useGameStore((s) => s.language);

  function t(key: string, params?: Record<string, string | number>): string {
    return translate(key, language, params);
  }

  function getTip(id: string) {
    return getGameTip(id, language);
  }

  return { t, getTip, language };
}
