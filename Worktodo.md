# Worktodo — Typing Speed Test (Next.js + Tailwind + GSAP)

This checklist outlines the steps to implement the full Typing Speed Test using Next.js (App Router), React, Tailwind CSS, GSAP for animations, and Next Server Actions to store high-score cookies.

## High-level plan

- [ ] Initialize Next.js app (TypeScript) — `next init`, enable App Router
- [ ] Install deps: `tailwindcss`, `postcss`, `autoprefixer`, `gsap`, `clsx`, `eslint`, `prettier`, `jest`/`vitest`
- [ ] Configure Tailwind and global styles
- [ ] Create folder structure: `app/`, `components/`, `lib/`, `data/` (add `data.json`)

## Core features (implementation steps)

1. Initialize project
   - Scaffold with `create-next-app@latest` (TypeScript, App Router, Tailwind disabled for now)
   - Enable experimental features you plan to use (Server Actions, Turbopack in dev) in `next.config.js`
   - Confirm `package.json` scripts (`dev`, `build`, `start`, `lint`, `test`) and add `typecheck` if using `tsc --noEmit`
   - Clean boilerplate pages/components so `app/page.tsx` renders a placeholder shell
   - Commit the clean scaffold before layering features

2. Styling & UI setup
   - Install `tailwindcss postcss autoprefixer` and run `npx tailwindcss init -p`
   - Populate `tailwind.config.ts` with custom colors, fonts, spacing based on `style-guide.md`
   - Define global CSS reset (modern normalize) inside `app/globals.css`
   - Import Sora variable font (local file under `assets/fonts`) via `@font-face` for performance
   - Build reusable utility classes (e.g., `.stat-pill`, `.panel`) via `@layer components`

3. Data and API
   - Place provided `data.json` inside `data/`; define TypeScript types (`Passage`, `Difficulty`)
   - Create `lib/passages.ts` with helpers: `getPassagesByDifficulty`, `getRandomPassage`
   - Consider a server action `getRandomPassageAction` that accepts difficulty and returns a passage, so the client stays thin
   - If you need CSR fallback, expose a GET route in `app/api/passages/route.ts` reusing the same helpers

4. Passage selection
   - Build a difficulty toggle group (radios or segmented control) wired to state
   - On change, call the passage helper/action to fetch a fresh passage; ensure spinner/skeleton while loading
   - Track last passage ID per difficulty to avoid immediate repeats (simple `previousPassageId` comparison)
   - Preload the passage on landing so test can start instantly when user clicks start

5. Typing core
   - Wrap the passage in a `contentEditable={false}` container and capture input via hidden `<textarea>` or keystroke listener on the page
   - Maintain arrays for `typedChars`, `errors`, and `cursorIndex` using React state or a reducer for deterministic updates
   - Normalize input (handle smart quotes, uppercase) to match source passage before comparisons
   - On backspace, move cursor back but keep a record of the original mistake for accuracy calculations
   - Provide a `resetTest()` helper that clears timers, stats, and loads a new passage

6. Visual feedback
   - Render each passage character as a span with deterministic key `char-${index}` for GSAP targeting
   - Apply Tailwind classes conditionally: `text-green-400` for correct, `text-red-400 underline` for incorrect, `bg-white/20` for active cursor
   - Smoothly scroll the active line into view when cursor approaches viewport edge (use `scrollIntoView` throttled)
   - Add optional “ghost caret” element positioned via `getBoundingClientRect` for extra polish

7. Modes & timer
   - Maintain `mode` state union: `'timed' | 'passage'`
   - Build a reusable timer hook that accepts `duration`, `autoStart`, and exposes `timeRemaining`, `timeElapsed`, `start`, `pause`, `reset`
   - For timed mode, end the test when `timeRemaining === 0` or `cursorIndex === passage.length`
   - For passage mode, keep counting upward until all characters typed; allow manual stop button
   - Start timer once user types or presses Start; disable Start until a passage is loaded

8. Real-time stats
   - Store `correctCharCount`, `incorrectCharCount`, `elapsedSeconds`
   - WPM formula: `(correctCharCount / 5) / (elapsedSeconds / 60)` with guard for zero seconds
   - Accuracy: `correctCharCount / (correctCharCount + incorrectCharCount)`
   - Display stats in a sticky panel; color-code values as they improve/decline (GSAP-friendly numbers)
   - Debounce expensive calculations with `useMemo` or a reducer pattern

9. Controls & UX
   - Create a `ControlPanel` component with buttons for Start, Restart, Mode, Difficulty
   - Restart should reset timers, stats, and request a new passage without a full page reload
   - Clicking the passage should focus the hidden input; use `aria-live="polite"` to inform screen readers the test began
   - Add tooltips or helper text explaining Timed vs Passage modes

10. Results and persistence
   - When the test ends, open a modal overlay summarizing stats plus CTA buttons (Retry, New Passage)
   - Detect first completion by checking absence of `personalBest` in `localStorage`; set baseline copy accordingly
   - Compare current WPM vs stored best to trigger “High Score Smashed!” state
   - Serialize results to `localStorage` (best WPM, accuracy, timestamp) and mirror them to cookies via server action for SSR

11. Server Actions & cookies
   - Create `app/actions/highScore.ts` exporting `setHighScoreAction(formData)` using `cookies().set()`
   - Call the action from the results modal (wrap in `<form action={setHighScoreAction}>` or `useTransition` with `startTransition`)
   - Read cookie inside `app/layout.tsx` or a server component to preload current best on first paint
   - Validate payload server-side (e.g., only accept numeric WPM, cap size) before writing cookie

12. Animations (GSAP)
   - Initialize GSAP timelines in `useLayoutEffect` guarded by `typeof window !== 'undefined'`
   - Animate panels sliding in, stats number counting, and difficulty toggle underline with GSAP timelines
   - Trigger confetti using `gsap.fromTo` on a dedicated `<canvas>` or DOM elements when high score is beaten
   - Respect `prefers-reduced-motion` by disabling non-essential animations with a custom hook

13. Accessibility
   - Ensure every control is reachable via keyboard (`button`, `role="tab"` for difficulty selector)
   - Provide visible focus outlines with Tailwind `focus-visible` utilities
   - Use `aria-live` regions for timer warnings (“10 seconds remaining”)
   - Lock focus inside the results modal using a focus trap when open

14. Testing & quality
   - Use Vitest or Jest + RTL to test `useTypingTest` hook logic (stat calculations, timer transitions)
   - Snapshot test the rendered passage markup for state permutations (idle, typing, complete)
   - Configure ESLint with `next/core-web-vitals` and Prettier integration
   - Add Husky pre-commit hooking `pnpm lint && pnpm test && pnpm typecheck`

15. Responsiveness & polish
   - Build mobile-first column layout, then add desktop grid with stats sidebar
   - Ensure the passage container maintains comfortable line length (~65 chars) via `max-w` and responsive font sizes
   - Implement hover/focus states matching design tokens; add subtle GSAP hover lifts on CTA buttons
   - Test across breakpoints (360px, 768px, 1280px) and adjust padding/margins accordingly

16. Deployment
   - Set up Vercel project connected to GitHub repo; enable environment variables if needed
   - Confirm Server Actions are allowed (no `vercel.json` overrides blocking)
   - After deployment, test high-score cookie persistence in production and ensure same-site settings are correct

17. Docs & housekeeping
   - Rewrite `README.md` detailing tech stack, features, and instructions to run `pnpm dev`
   - Document architectural decisions (hooks, reducers, server actions) in a short `docs/architecture.md`
   - Include troubleshooting tips (e.g., clearing cookies resets high score)

18. Optional enhancements
   - Theme toggle with CSS variables persisted in `localStorage`
   - Multi-user support via Supabase or Prisma + SQLite for storing profiles
   - Social share card generation (OG image with stats) on completion

## Next immediate actions (first 48 hours)

- [ ] Initialize Next.js app and commit initial scaffold
- [ ] Configure Tailwind and global styles
- [ ] Add `data.json` and `lib/passages.ts` helper
- [ ] Implement basic `TypingTest` that renders characters and captures input

---

If you'd like, I can scaffold the Next app, install deps, and implement the basic `TypingTest` component next. Want me to start with project initialization now?
