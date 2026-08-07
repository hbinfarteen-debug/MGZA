---
Task ID: 1
Agent: Main Agent
Task: Fix UI bugs (tip clipping, layout shift, graph size) + Implement minister replacement with 3 candidates + Functional elections with game over

Work Log:
- Fixed StatCard hover effect causing layout shift by removing `shadow-sm` class
- Fixed MetricCard hover effect causing layout shift by removing `transition-colors hover:bg-muted/50`
- Verified HoverTip already uses `position: fixed` + `className="contents"` wrapper (no layout shift)
- Added ReplacementCandidate and ReplacementDialogState interfaces to game-store.ts
- Added `showReplacementDialog` state, `replaceMinister` and `setShowReplacementDialog` actions
- Updated `fireMinister` to fire minister AND show replacement dialog with 3 candidates
- Added `generateReplacementCandidates()` with Zimbabwean names, 3 distinct profiles (good/loyal/risky)
- Created `MinisterReplacementDialog` component in page.tsx with stat comparisons and popularity impact display
- Added `simulateElections()` function in engine.ts that:
  - Updates polls every 3 turns based on popularity, satisfaction, legitimacy, economic factors
  - Checks if election month/year has arrived
  - Calculates election results with turnout, campaign funds bonus, randomness
  - Player wins if >50% or >45% with 5% margin
  - On win: records historical result, creates next election 5 years later, boosts legitimacy
  - On loss: sets isGameOver with detailed election defeat reason
- Updated ElectionsScreen with urgency banner, election result display, vote counts, strategy tips
- Updated GameOverScreen with election-specific styling (🗳️ icon), extra stats, Shona proverb
- Updated `fire_minister` tip description to mention replacement dialog
- Server-side rendered HTML verified: Start Screen with Zimbabwe flag colors, game content present
- Lint passes with zero errors

Stage Summary:
- All 3 UI bugs fixed (tip clipping, layout shift, graph size)
- Minister replacement: 3 candidates with Zimbabwean names, stats, descriptions, and popularity impact
- Elections fully functional: polls update, election triggers on date, win/lose conditions, game over on loss
- Next election auto-created 5 years after a win
- Key files modified: page.tsx, game-store.ts, engine.ts
