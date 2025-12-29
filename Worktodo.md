# Worktodo — Typing Speed Test (Next.js + Tailwind + GSAP)

This todo list outlines how to build the Typing Speed Test with Next.js (App Router), React, Tailwind CSS, GSAP animations, and Next Server Actions for cookie-backed high scores. Each section expands on the original checklist so you can track progress as you set up the project and implement every feature.

## High-level plan

- [ ] Initialize the Next.js App Router project with TypeScript (`create-next-app@latest`), ensuring the repo starts from a clean, committed scaffold.
- [ ] Install baseline dependencies (`tailwindcss`, `postcss`, `autoprefixer`, `gsap`, `clsx`, `eslint`, `prettier`, `jest`/`vitest`, plus `@types` packages) and verify lockfile consistency.
- [ ] Configure Tailwind (`tailwind.config.ts`, `postcss.config.js`, `app/globals.css`) and wire global styles + resets required by the design system.
- [ ] Create the core folders (`app/`, `components/`, `lib/`, `data/`, `assets/`) and place seed artifacts such as `data/data.json`, starter hooks, and fonts.

## Core features (implementation steps)

1. Initialize project
   - [ ] Run `pnpm create next-app` (TypeScript, App Router, ESLint, no Tailwind) and remove boilerplate routes, leaving a placeholder layout/page.
   - [ ] Enable experimental flags (Server Actions, Turbopack in dev) in `next.config.js` and document them in comments for future upgrades.
   - [ ] Review `package.json` scripts; add `typecheck` (`tsc --noEmit`) and align lint/test scripts with the tooling you plan to enforce.
   - [ ] Commit the pristine scaffold (`feat: init next app`) before layering Tailwind, data, or custom components.

2. Styling & UI setup
   - [ ] Add Tailwind via `pnpm install -D tailwindcss postcss autoprefixer` then `npx tailwindcss init -p`, ensuring the config imports Next’s `fontFamily`.
   - [ ] Extend `tailwind.config.ts` with tokens from `style-guide.md` (colors, spacing scale, font sizes, letter spacing) and enable `content` paths for `app/**/*`, `components/**/*`, and MDX if needed.
   - [ ] Implement a modern CSS reset (e.g., `@layer base { *, *::before, *::after { box-sizing: border-box; } }`) plus custom body background/typography inside `app/globals.css`.
   - [ ] Import the Sora variable font from `assets/fonts` using `@font-face` and expose it via Tailwind theme + CSS variables.
   - [ ] Define reusable component utilities (`stat-pill`, `panel`, button variants) inside `@layer components` so Tailwind classes stay consistent.

3. Data and API
   - [ ] Drop the supplied passages into `data/data.json` and model TypeScript types (`Passage`, `Difficulty`, `Mode`) inside `types/passage.d.ts` or `lib/types.ts`.
   - [ ] Build `lib/passages.ts` with helpers (`getPassagesByDifficulty`, `getRandomPassage`, `getNextPassageId`) and unit-test them in isolation.
   - [ ] Create a Server Action `getRandomPassageAction` that accepts difficulty, fetches data, and returns a serialized passage for client components.
   - [ ] Add a REST fallback at `app/api/passages/route.ts` that reuses the helper functions for CSR or prefetch scenarios.

4. Passage selection
   - [ ] Implement a segmented-control/difficulty toggle component with headless UI patterns (radio group with keyboard support) and Tailwind styling.
   - [ ] On difficulty change, trigger `getRandomPassageAction` (or fetcher hook) and display skeleton loaders/spinners until the passage resolves.
   - [ ] Track last passage IDs per difficulty (e.g., Map) to avoid immediate repeats; skip and refetch when collisions occur.
   - [ ] Preload a passage when the page mounts so users can immediately start typing after selecting mode/difficulty.

5. Typing core
   - [ ] Use a hidden `<textarea>` or `contentEditable={true}` trap inside the `TypingTest` component to capture keystrokes; forward focus when clicking the passage.
   - [ ] Maintain reducer-driven state (`typedChars`, `errors`, `cursorIndex`, `history`) to ensure deterministic updates and replayability.
   - [ ] Normalize characters (smart quotes, capitalization, whitespace) before comparison so dataset quirks don’t reduce accuracy.
   - [ ] Support backspace logic that repositions the cursor and tracks original mistakes separately for stats.
   - [ ] Expose a `resetTest()` function to clear timers, stats, selections, and load a fresh passage.

6. Visual feedback
   - [ ] Render each passage character as a `<span key={`char-${index}`}>` with data attributes for GSAP targeting and ARIA labelling.
   - [ ] Apply Tailwind states: correct (`text-emerald-400`), incorrect (`text-rose-400 underline`), current cursor (`bg-white/20`), untouched (`text-white/60`).
   - [ ] Auto-scroll the active line into view using `scrollIntoView({ block: 'nearest' })`, throttled/debounced to prevent jank.
   - [ ] Add a “ghost caret” that follows the actual cursor via `getBoundingClientRect` and GSAP tweens for polish.

7. Modes & timer
   - [ ] Store mode as a union (`'timed' | 'passage'`) and expose switch controls in the UI.
   - [ ] Build a `useTimer` hook supporting `duration`, `autoStart`, `start/pause/reset`, and event callbacks for completion.
   - [ ] End timed sessions when `timeRemaining === 0` or text completes; in passage mode, let the timer count upward until completion or manual stop.
   - [ ] Gate the Start button until a passage is ready, and auto-start the timer on first keystroke for natural UX.

8. Real-time stats
   - [ ] Track counts (`correctCharCount`, `incorrectCharCount`, `elapsedSeconds`, `grossKeystrokes`) inside the main reducer or a memoized selector.
   - [ ] Compute WPM `(correctCharCount / 5) / (elapsedSeconds / 60)` with guard rails for early seconds; show WPM, accuracy, and time simultaneously.
   - [ ] Render stats in a sticky sidebar/panel, color-coding improvements vs declines using GSAP number tweens.
   - [ ] Debounce heavy computations and use `useMemo` or derived state to prevent unnecessary rerenders.

9. Controls & UX
   - [ ] Build a `ControlPanel` component that houses Start, Restart, Mode toggle, Difficulty toggle, and instructions.
   - [ ] Restart should call `resetTest()` and request a new passage without reloading the page; maintain focus on the hidden input afterwards.
   - [ ] Add `aria-live="polite"` announcements when the test begins, mode switches, or the timer warns of low time.
   - [ ] Provide helper text or tooltips describing Timed vs Passage modes plus keyboard shortcuts (e.g., `Esc` to reset).

10. Results and persistence
   - [ ] Show a modal overlay when the test ends, summarizing stats, differences vs previous best, and CTA buttons (Retry, New Passage, Change Mode).
   - [ ] Detect first completion by checking for `personalBest` in `localStorage`; display onboarding copy if absent.
   - [ ] Compare the new WPM with stored best to trigger a “High Score” state and associated animation.
   - [ ] Persist results to `localStorage` (best WPM, accuracy, timestamp) and mirror to cookies via Server Action so SSR can hydrate with the best score.

11. Server Actions & cookies
   - [ ] Implement `app/actions/highScore.ts` with `export async function setHighScoreAction(formData)` calling `cookies().set()`, input validation, and safe defaults.
   - [ ] Invoke the action from the results modal via form submission or `startTransition`, ensuring UX stays responsive.
   - [ ] Read cookies in `app/layout.tsx` (server component) to preload `personalBest` for immediate display.
   - [ ] Add guards (numeric bounds, same-site settings, expiration length) before writing cookies to prevent abuse.

12. Animations (GSAP)
   - [ ] Initialize GSAP timelines inside `useLayoutEffect` with `context` cleanup; protect with `if (typeof window === 'undefined') return`.
   - [ ] Animate panel entrances, stat counters, and difficulty underline transitions on mount/interaction.
   - [ ] Trigger confetti (canvas or DOM) when a high score is achieved; scope to a `prefers-reduced-motion` aware hook to disable as needed.
   - [ ] Encapsulate animation logic in custom hooks or utility modules for readability and reuse.

13. Accessibility
   - [ ] Ensure all controls are semantic elements (`button`, `input[type=radio]`, `role="tablist"`) with keyboard navigability.
   - [ ] Provide focus-visible outlines and maintain focus order when modals open/close (use a focus trap).
   - [ ] Publish timer warnings (“10 seconds remaining”) via `aria-live="assertive"` regions, respecting screen reader expectations.
   - [ ] Test with keyboard-only navigation and screen readers to confirm the typing area, controls, and modal all comply.

14. Testing & quality
   - [ ] Set up Vitest or Jest + React Testing Library; write unit tests for `useTypingTest`, `useTimer`, and passage helpers.
   - [ ] Snapshot or DOM-state tests for passage rendering across idle/typing/completed states to guard regressions.
   - [ ] Configure ESLint (`next/core-web-vitals`) + Prettier integration, verifying `pnpm lint` passes CI.
   - [ ] Add Husky pre-commit hooks running `lint`, `test`, and `typecheck` to keep the repo healthy.

15. Responsiveness & polish
   - [ ] Design mobile-first layout with a single column stack, then upgrade to desktop grid with stats sidebar and fixed width content.
   - [ ] Constrain passage width (~65 characters) using `max-w-prose` or custom clamps; adjust font size per breakpoint.
   - [ ] Align hover/focus states with tokens; add micro-interactions (GSAP hover lift on CTA buttons, subtle drop shadows).
   - [ ] Validate responsiveness at 360px, 768px, 1024px, 1280px, ensuring comfortable spacing and readable text.

16. Deployment
   - [ ] Connect the repo to Vercel, set the framework preset to Next.js (App Router), and confirm Server Actions are enabled.
   - [ ] Verify environment settings (no `vercel.json` overrides that would disable Server Actions or Edge runtime when not intended).
   - [ ] After deployment, run through the full workflow (typing test, modal, cookie persistence) in production and document findings.

17. Docs & housekeeping
   - [ ] Rewrite `README.md` covering tech stack, setup (`pnpm install`, `pnpm dev`), test commands, and deployment instructions.
   - [ ] Create `docs/architecture.md` summarizing key decisions (hooks vs reducers, data flow, animations, Server Actions).
   - [ ] Add troubleshooting tips (resetting cookies/localStorage, common dev server issues) for future maintainers.

18. Optional enhancements
   - [ ] Theme toggle (light/dark) powered by CSS variables + `localStorage` persistence, integrated into the Control Panel.
   - [ ] Multi-user profiles backed by Supabase or Prisma + SQLite, enabling server-side storage of scores.
   - [ ] Social share image (OG) generation after completion, e.g., via a dedicated route that renders stats into an image.

## Next immediate actions (first 48 hours)

- [ ] Initialize the Next.js project, push the clean scaffold, and confirm scripts run.
- [ ] Install/configure Tailwind + global styles so layouts and tokens are ready.
- [ ] Import `data.json`, define passage types, and author `lib/passages.ts` helpers.
- [ ] Prototype the basic `TypingTest` component (renders passage, captures keystrokes, logs stats to console) before layering timers or animations.

---

Ready to proceed with scaffold + initial Tailwind setup whenever you are.