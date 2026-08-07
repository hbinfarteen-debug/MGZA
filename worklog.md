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
