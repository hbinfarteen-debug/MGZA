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
