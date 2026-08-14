---
Task ID: 1
Agent: main
Task: Fix dark mode on start/hero screen

Work Log:
- Added `.zim-force-light` CSS class to globals.css that overrides all dark theme CSS variables back to light values
- Added `.zim-force-light .zim-card` and `.zim-force-light .zim-badge` overrides for dark-specific component styles
- Applied `zim-force-light` class to start screen wrapper and game over screen wrapper in page.tsx
- Start screen now always renders in light theme regardless of user's dark mode setting

Stage Summary:
- Start screen and game over screen are now always light themed
- Dark mode only applies to in-game screens as requested by user
- CSS uses !important overrides to ensure light theme is forced on these containers

---
Task ID: 2
Agent: main
Task: Integrate i18n translations into page.tsx

Work Log:
- Verified i18n infrastructure already exists: `/src/lib/i18n.ts` (full en/sn/nd translations) and `/src/hooks/useTranslation.ts`
- Added `Globe` icon import from lucide-react
- Applied `zim-force-light` class to start screen and game over wrappers
- Added language selector to SettingsDialog with 3 language buttons (English, chiShona, isiNdebele)
- Added language selector to StartScreen inline settings panel
- Added `const { t } = useTranslation()` to GamePage, StartScreen, SettingsDialog, NewGameDialog, GameOverScreen, EventModal, DashboardScreen, ElectionsScreen
- Updated HoverTip component to use `getTip()` for translated tips
- Moved NAV_ITEMS inside GamePage with translated labels
- Translated StartScreen: title, subtitle, proverb, feature cards, description, button, footer, badges
- Translated NewGameDialog: title, description, labels, placeholders, tips toggle, button
- Translated GameOverScreen: title, stat labels, proverb, button
- Translated sidebar: Tips, Settings, New Game labels
- Translated game header: End Turn button, Game Log
- Translated SettingsDialog: title, description, dark mode label, text size label, close button
- Translated DashboardScreen: stat card labels (popularity, GDP growth, inflation, satisfaction)
- Translated EventModal: confirm decision button

Stage Summary:
- Language selector available in both start screen settings and in-game settings dialog
- All 16 official navigation items translated across all 3 languages
- Key UI elements translated: start screen, new game dialog, game over screen, sidebar, header, settings
- Dashboard stat cards translated (4 key metrics)
- Hover tips now display translated content
- Untranslated items (metric card labels, section headings in sub-screens) gracefully fall back to English
- ESLint: 0 errors, 0 warnings
---
Task ID: 2
Agent: main
Task: Move tips toggle below Elections in sidebar + Change currency to ZiG

Work Log:
- Moved tips toggle (Lightbulb icon + Switch) from sidebar footer to directly below Elections nav item with a Separator divider
- Removed tips toggle from bottom sidebar section (kept only Settings and New Game buttons)
- Changed all `$` currency displays in page.tsx to `ZiG` prefix:
  - Dashboard: GDP, Funds Lost to Corruption, GDP Trend chart format
  - Dashboard: Exchange rate display from `ZWL/USD` to `ZiG/USD` with 2 decimal places
  - Budget screen: Revenue, Allocated, Deficit, GDP stat cards, budget item min/rec/allocated values
  - Infrastructure screen: Total Invested, project costs
  - Energy screen: power plant cost per MW
  - Game Over screen: final GDP
- Updated constants.ts: exchangeRate from 4500 to 26.37
- Updated engine.ts:
  - Exchange rate simulation thresholds: >3000→>30, >2000→>25, >5000→>35
  - Exchange rate delta values scaled for ZiG range (±0.3-0.6 instead of ±20-100)
  - Random exchange rate fluctuation: ±0.3 instead of ±50
  - News article text: `$`→`ZiG` in project completion and project generation
  - Event descriptions: `$2 billion`→`ZiG 2 billion`, `$45 million`→`ZiG 45 million`, `$4.5 billion`→`ZiG 4.5 billion`
  - Smuggling rate threshold: >5000→>35
- Updated types.ts: All `USD` and `ZWL` comments to `ZiG`

Stage Summary:
- Tips toggle now positioned in sidebar right after Elections nav item (with separator)
- All monetary values display in ZiG (Zimbabwe Gold) currency
- Exchange rate set to 26.37 ZiG/USD with properly scaled simulation dynamics
- Verified in browser: Dashboard shows "ZiG 28.5B" GDP, "26.37 ZiG/USD" exchange rate, Budget shows "ZiG 5,200M" Revenue
---
Task ID: 3
Agent: main
Task: Fix tips cards placement, ZW badge, em dashes, flag colors, version bump

Work Log:
- Moved tips toggle back to bottom sidebar section (with Settings & New Game buttons)
- Added static tips card below Elections in sidebar nav: shows contextual tip (title, description, strategy) for current screen, changes with AnimatePresence when switching screens
- Added "ZW" badge next to Zimbabwe flag emoji on hero page using Badge component with amber styling
- Fixed hero flag stripe bar: removed white (#FFFFFF), replaced with Zimbabwe gold (#E8A817) - now red, yellow, green
- Replaced all em dashes (—) with proper punctuation across all 3 languages:
  - Proverbs: — → : (colon)
  - Descriptions: — only → , only (comma)
  - Footer: — Made with → | Made with
  - Difficulty: Easy — → Easy:
  - All i18n.ts (en/sn/nd) and page.tsx visible text
- Bumped version from v1.0 to v1.1 in footer and all language translations

Stage Summary:
- Tips card visible below Elections with contextual advice, toggle at sidebar bottom
- ZW badge shows next to flag on hero
- No em dashes in user-visible text (only in code comments)
- Flag stripe: red, yellow, green
- Version: v1.1
---
Task ID: 4
Agent: main
Task: Fix tips card design, event timeout, flag colors, ZW badge, version bump

Work Log:
- Redesigned sidebar tips card below Elections to match the hover-tip popup design (bg-popover, border, lightbulb icon with amber bg, title, description, strategy section with info icon and border-t separator)
- Added EventTimer component with 45-second countdown: shows timer in event modal header (clock icon + seconds), turns amber at 20s, red + pulse at 10s
- Event timeout penalty: when timer hits 0, deducts 5 popularity, 3 legitimacy, 5 governance satisfaction, adds game log entry about indecision
- Added 4th flag stripe bar: now green (#2E8B37), yellow (#E8A817), red (#CC2936), black (#1a1a1a)
- Removed orange Badge ZW from hero page, replaced with black ZW text positioned absolutely near flag emoji (bottom-right)
- Bumped version from v1.1 to v1.2 in footer and all 3 language translations

Stage Summary:
- Tips card now matches hover-tip design (popover style with lightbulb, title, desc, strategy)
- Event decisions have 45s countdown with visible timer; indecision penalty applied
- Flag stripes: green, yellow, red, BLACK (4 stripes matching Zimbabwe flag)
- ZW displayed in black text near flag (orange badge removed)
- Version: v1.2
---
Task ID: 5
Agent: main
Task: Move hover tip card to sidebar below Elections, fix ZW/flag colors

Work Log:
- Added TipHoverContext (React.createContext) for shared hover state between HoverTip components and sidebar
- Rewrote HoverTip component: removed floating fixed-position tooltip popup (motion.div with position:fixed), replaced with context-based approach that sets hoveredTipId on mouseEnter and clears on mouseLeave
- Added HoverTipCard component: renders in sidebar below Elections, reads hoveredTipId from TipHoverContext, displays tip card with title/description/strategy using AnimatePresence animation
- Wrapped GamePage return with TipHoverContext.Provider (hoveredTipId state in GamePage)
- Removed static sidebarTip card (was showing unchanging tip based on current screen)
- Removed sidebarTip computation variable from GamePage
- Removed unused getTip from GamePage destructuring
- Removed unused penaltyApplied state from EventModal
- Fixed ZW text color from #1a1a1a (dark gray) to pure black (text-black)
- Fixed flag 4th stripe from #1a1a1a to #000000 (pure black)
- Added 4-stripe flag bar to game footer (green, yellow, red, black)
- Bumped version from v1.2 to v1.3 in footer and all 3 language translations

Stage Summary:
- Hover tip cards now render inline in sidebar below Elections (not floating overlay)
- Tip appears when hovering any HoverTip-wrapped element (stat cards, etc.) and disappears on mouse leave
- No static tip card; tips are purely hover-driven
- ZW text is pure black, flag 4th stripe is pure black
- Footer has 4-stripe Zimbabwe flag bar
- Version: v1.3

---
Task ID: 6
Agent: main
Task: Leaderboard with per-difficulty boards and 24h snapshot refresh

Work Log:
- Added composite score computation in src/lib/scoreboard.ts: popularity + satisfaction + legitimacy + longevity bonus (years x 5, capped 40) + log10 GDP x 10 bonus - corruption penalty (nationalLevel x 0.5)
- Added SQLite leaderboard store src/lib/leaderboard-db.ts using bun:sqlite (bun dev runtime) with node:sqlite fallback via process.getBuiltinModule; DB file db/leaderboard.db with leaderboard_entries and leaderboard_snapshots tables
- Added GET /api/leaderboard?difficulty=: returns cached top-50 snapshot; recomputes from DB only when snapshot is older than 24h (SNAPSHOT_TTL_MS), serves cached snapshot otherwise with lastUpdatedAt/nextUpdateAt timestamps
- Added POST /api/leaderboard/submit: validates name (max 30 chars) and difficulty, inserts entry with full stats, returns entry id and rank within that difficulty
- Added runId (UUID) to GameState set in startNewGame so each run submits its score exactly once; GameOverScreen submits on mount, dedupe via localStorage mgza-submitted-{runId}, stores entry id in mgza-entry-{difficulty}
- Added LeaderboardScreen with Easy/Normal/Hard tabs, rank medals (gold/silver/bronze), score/popularity/satisfaction/GDP/years columns, YOU badge for own entry, Refresh button, last-updated and next-update timestamps
- Added Leaderboard nav item (Trophy icon) to sidebar after Elections; added leaderboard screen to GameScreen union and screen render switch; game over screen gained View Leaderboard button
- Added leaderboard i18n keys to all 3 languages (en/sn/nd), no em dashes used
- Bumped version from v1.3 to v1.4 in footer and all 3 language translations
- Verified end-to-end in browser: start screen v1.4, leaderboard renders entries with medals, difficulty tabs switch boards, game over auto-submits score and shows Your result has been recorded, API returns rank + 24h snapshot timestamps
- ESLint: 0 errors, 0 warnings

Stage Summary:
- Players are ranked by a composite governance score, name = president name from new game dialog
- Separate leaderboards per difficulty (easy/normal/hard)
- Scores submit instantly; the displayed board is refreshed once per 24h cycle with timestamps shown
- Storage: db/leaderboard.db via bun:sqlite (no Prisma dependency)
- Version: v1.4


---
Task ID: 7
Agent: main
Task: Hero redesign + New Game modal contrast fixes

Work Log:
- Replaced light gradient hero with dark-institutional design: charcoal #14140F to near-black #0A0A08 gradient, chevron SVG texture at 5% opacity, 4-color Zimbabwe flag stripe (3px full width, hard stops #006400/#FFD200/#DE2010/#000000)
- Added Anton (--font-anton) and Plus Jakarta Sans (--font-jakarta) fonts to layout.tsx via next/font; headline uses Anton with solid green #4A9D3F / gold #E8A93C lines, subtitle/badges use Plus Jakarta Sans
- Added .zim-hero-dark to globals.css: pins dark tokens (charcoal background, --muted-foreground #8A8A80, --border #3A3A32) on the start screen wrapper AND New Game dialog (Radix portal); .zim-hero-* classes own title, subtitle, proverb, badge, card (1px flag-color top border, #1C1C16), desc, CTA (solid #3D7A32, 8px radius), footer
- Rewrote StartScreen JSX: hero title, subtitle, proverb quote with serif quotes, badges, feature cards (green/gold/red top borders), description, CTA, footer; updated SettingsDialog button to ghost variant
- Fixed badge row overflow on mobile (flex-wrap) so the 3 badges wrap under 390px
- New Game modal contrast pass: .zim-modal class sets surface #1C1C16 + 0 20px 60px rgba(0,0,0,0.6) shadow + #3A3A32 border, text #E8E8DE, --muted-foreground #A8A89E, --card #23231B for the tips row; overlay darkened to rgba(0,0,0,0.7) with 4px backdrop blur via :has(+ .zim-modal); close icon #8A8A80 (white on hover) at 20px; input border #3A3A32 default / gold #E8A93C on focus
- Verified in browser (1440x900 + 390x844): Anton headline, stripe, chevron, CTA, dialog dark surface, contrast fixes, no horizontal overflow; ESLint clean
- Updated AGENTS.md hero convention + version v1.4

Stage Summary:
- Start screen is now a dark institutional hero (Anton + Plus Jakarta Sans, flag stripe, chevron texture) that renders dark regardless of theme setting
- New Game dialog reads as a distinct floating surface over a darkened blurred scrim, all text AA contrast
- Mobile: badges wrap, no horizontal overflow


---
Task ID: 8
Agent: main
Task: Zero military budget coup

Work Log:
- Added militaryZeroTurns field to GameState (types.ts)
- Extended checkGameOver in engine.ts: if military budget allocation is 0, increments a counter each turn; after 3 consecutive turns at zero, game over with reason "MILITARY COUP: With the defense budget cut to zero, the armed forces seized power without warning. Your presidency is over." (no em dashes, hardcoded English like other reasons)
- Raising the military budget above 0 resets the counter (no coup)
- Verified with bun engine script: coup fires on exactly turn 3, countdown resets when budget restored
- Verified end-to-end in browser: set military slider to 0, ended 3 turns, game over screen showed the coup reason
- ESLint clean

Stage Summary:
- Starving the military to 0 triggers an unavoidable coup after 3 turns with no warning
- Restoring the budget before turn 3 cancels the coup


---
Task ID: 9
Agent: main
Task: Zero-budget sector crisis system

Work Log:
- Replaced militaryZeroTurns with budgetZeroTurns: Partial<Record<BudgetCategory, number>> (types.ts) tracking consecutive zero turns per category
- Added BUDGET_CRISES config + simulateBudgetCrises() in engine.ts, run each turn in simulateTurn before checkGameOver; silent, like the coup: crisis fires at each sector threshold, pushing a game log entry + breaking news article (English-only, no em dashes, matching existing gameLog/news precedent)
- Military: threshold 3, unchanged game over (MILITARY COUP), moved onto the shared map
- Police: crime wave at 4 turns (repeat, re-fires every 4 turns), ANARCHY game over at 10 consecutive turns at zero
- Other sectors (non-fatal, feed existing game-over cascades): hospitals/water/energy at 4, education/roads/agriculture/mining/housing/social_welfare at 5, youth/ict/tourism/disaster_relief/debt_repayment at 6, administration at 7
- Persistent stat shocks chosen over recomputed ones: energy crisis hits maintenanceBacklog (drives load shedding) instead of loadSheddingHoursPerDay; mining hits taxRevenue instead of governmentRevenue; district crime/safetyIndex/province output fields verified persistent
- Counter resets when a sector is re-funded; recurring crises re-fire every threshold turns while starved
- Verified with bun engine tests: all 17 sectors fire at exact thresholds, police crime waves at 4/8 + anarchy at 10, hospitals deathRate +7.5 across 5 waves in 20 turns, restore resets counters, baseline clean at 12 turns
- Verified in browser: police to 0, crime wave news on News screen, game log entry at turn 4, game continues past turn 5
- ESLint clean

Stage Summary:
- Starving any ministry now produces an appropriate sector crisis; only military (3 turns) and police (10 turns, anarchy) end the game
- All messages English hardcoded in game log/news consistent with existing precedent


---
Task ID: 10
Agent: main
Task: GDP, inflation and ministers affect election turnout

Work Log:
- Reworked the election-day turnout formula in simulateElections (engine.ts): base 55 + satisfaction x 0.3 now modulated by:
  - gdpFactor: clamp(gdpGrowth, -10, +10) x 0.5 (strong growth mobilizes voters)
  - inflationFactor: clamp((25 - inflation) x 0.15, -12, +3) (sub-25% inflation slightly boosts turnout; past 25% it suppresses it)
  - ministerFactor: avg popularity of active ministers x 0.1 minus 1.5 per fired/inactive minister
- Turnout stays clamped 40-85; polls and vote share untouched (they already factor GDP/inflation)
- Verified with bun engine tests at election day (turn 44, Aug 2028): boom (GDP+10, infl 10) 81.1 > baseline 72.2 > crisis (GDP-10, infl 100) 51.2; gutted cabinet 51.3 with nearly identical satisfaction to baseline (drop is purely the minister penalty); popular cabinet 84.7
- ESLint clean

Stage Summary:
- Election turnout now reacts to economic performance and cabinet strength, giving fired ministers and economic collapse an electoral consequence


Task ID: 11b
Agent: main
Task: Event deck fixups, round 2

Work Log:
- Redone after verification found earlier fix edits had not persisted to disk: dead targets re-fixed (agricultural production, national.educationIndex x2, budget.healthcare, budget.mines, energy.sources.imported.output)
- New findings on the real file state: economic.miningOutput is a province field, not economic; mining_accident choices retargeted to economic.gdpGrowth; fuel_shortage trade.mainImportPartners (array of objects, setNested would string-concat) retargeted to trade.imports
- trade.* branch in applyEffect (game-store.ts) re-applied and confirmed; pre-existing fuel_shortage + diplomatic_crisis trade effects now actually apply
- Re-verified on current file: 35 unique cards (15 crisis / 10 major / 10 minor), every condition runs, every target resolves, ESLint clean

Stage Summary:
- Event card pool complete and verified end to end

---
Task ID: 13
Agent: main
Task: Migrate leaderboard from SQLite to Supabase

Work Log:
- Installed @supabase/supabase-js (2.112.3); added SUPABASE_URL (https://epcbliaeovtdtjmsdyhk.supabase.co) + SUPABASE_ANON_KEY (sb_publishable_...) to .env
- Wrote supabase/schema.sql: leaderboard_entries + leaderboard_snapshots tables (mirror old SQLite schema), score index, RLS policies allowing anon read/insert/upsert (public leaderboard, no auth); re-runnable via drop policy if exists
- Rewrote src/lib/leaderboard-db.ts: swapped bun:sqlite driver for createClient(...) singleton; kept the exact exported interface (insertEntry/getEntries/countHigherScorers/getSnapshot/upsertSnapshot + row types) so API routes only needed awaits
- Updated GET /api/leaderboard and POST /api/leaderboard/submit to await the now-async store calls; 24h snapshot caching behavior unchanged
- Verified end-to-end: GET returns empty board + snapshot timestamps, POST inserted entry with rank 1, direct PostgREST read confirms row columns; anon key correctly blocked DELETE (no RLS delete policy)
- ESLint clean; tsc errors in submit route (fields tuple typing) are pre-existing and build-ignored
- Bumped version from v1.5 to v1.6 in footer and all 3 language translations; updated AGENTS.md leaderboard section

Stage Summary:
- Leaderboard now lives in the Supabase project; API contract unchanged
- Tables + RLS are created by running supabase/schema.sql in the Supabase SQL Editor
- One test row (Test Comrade, normal, 87.5) remains in leaderboard_entries, to be deleted in the Table Editor
- Version: v1.6

---
Task ID: 12
Agent: main
Task: Convert start-screen hero from dark-institutional to clean light theme

Work Log:
- Replaced .zim-hero-dark with .zim-hero-light in globals.css: pins light tokens (background #FAFAF7, foreground #1A1A1A, card #FFFFFF, primary #2E8B37, border #E5E0D8, color-scheme light) on the start screen wrapper AND New Game dialog; dark-forced variables removed
- .zim-hero-bg gradient changed from charcoal (#14140F to #0A0A08) to light institutional (#FAFAF7 to #F2F0EB to #EDE8DF); chevron texture stroke %23ffffff to %232E8B37 at same 5% opacity; ambient glows kept green/gold but lowered to rgba(46,139,55,0.06) and rgba(232,169,60,0.05)
- Light-text pass on hero classes: subtitle #5C5650, proverb #6B6560, badge #3D3028 with #D8D0C4 border (gold hover unchanged), card #FFFFFF with #E5E0D8 borders, hover soft warm shadow rgba(92,76,55,0.14) + background #F9F6F0, desc #4A4440, footer #9A9490; CTA and icon glow unchanged
- .zim-modal updated to light surface: #FFFFFF, #E5E0D8 border, #1A1A1A text, --muted-foreground #6B6560, --card #FFFFFF; close icon #9A9490 (dark on hover); overlay softened to rgba(26,26,22,0.45)
- page.tsx: start screen wrapper and NewGameDialog DialogContent switched zim-hero-dark to zim-hero-light; gameplay screens untouched
- Bumped version from v1.4 to v1.5 in footer and all 3 language translations
- ESLint clean

Stage Summary:
- Start screen now renders as a clean light institutional hero (white/cream to warm stone gradient, green chevron texture) regardless of theme setting
- In-game dark mode and game-over screen unchanged
- New Game dialog reads as a white floating surface over a softened scrim
- Version: v1.5
