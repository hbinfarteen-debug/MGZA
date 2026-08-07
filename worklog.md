---
Task ID: 2
Agent: Main Agent
Task: Add text size settings and dark mode toggle to game settings

Work Log:
- Created ThemeProvider component wrapping next-themes in src/components/theme-provider.tsx
- Updated layout.tsx to wrap children in ThemeProvider with attribute="class", defaultTheme="light"
- Added FontSize type ('small' | 'medium' | 'large' | 'xlarge') and darkMode/fontSize state to game-store.ts
- Added setFontSize and setDarkMode actions, persisted both in partialize
- Added --mgza-font-size CSS custom property to html element in globals.css (default 16px)
- Created SettingsDialog component with dark mode toggle (Switch) and text size selector (4 grid buttons with Aa preview)
- Added Settings button in game header (separate from game log button)
- Added Settings button in sidebar footer
- Added Settings panel on Start Screen (inline expandable panel with Framer Motion)
- Synced store darkMode with next-themes using bidirectional useEffect hooks in GamePage and StartScreen
- Applied font size via CSS custom property on document.documentElement
- Added Sun, Moon, Type icons from lucide-react

Stage Summary:
- Text size: 4 options (small=14px, medium=16px, large=18px, xlarge=20px) — scales all rem-based text
- Dark mode: full Zimbabwe-flag-themed dark theme already existed in globals.css, now toggleable
- Settings accessible from: Start Screen (inline), game header (dialog), sidebar (dialog)
- Both settings persisted to localStorage via Zustand persist middleware
- Fixed React 19 lint error: replaced useState+setState-in-effect with useRef for mounted tracking
- Fixed infinite loop: changed bidirectional dark mode sync to one-way (store → next-themes only)
- Browser verified: dark mode toggle works, text size changes apply correctly, no runtime errors
- Lint passes with zero errors and zero warnings
