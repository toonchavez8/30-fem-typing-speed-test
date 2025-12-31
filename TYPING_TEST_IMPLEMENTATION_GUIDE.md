# Typing Test Implementation Guide

> **Important**: This document contains logic design and documentation only. No `.ts` or `.tsx` files should be modified based on this guide until explicitly authorized.

---

## Table of Contents

1. [Playwright Setup (Next.js DevTools Compatible)](#1-playwright-setup-nextjs-devtools-compatible)
2. [Modal Exit Prevention Logic](#2-modal-exit-prevention-logic)
3. [Modal Text Logic](#3-modal-text-logic)
4. [Overlay Blur Behavior](#4-overlay-blur-behavior)
5. [Playwright Tests](#5-playwright-tests)

---

## 1. Playwright Setup (Next.js DevTools Compatible)

### Why Playwright?

Playwright is the recommended E2E testing framework for Next.js applications because:

- **Official Support**: Next.js 16+ includes built-in MCP (Model Context Protocol) integration with Playwright
- **Cross-browser Testing**: Supports Chromium, Firefox, and WebKit
- **Component Testing**: Allows testing React components in isolation
- **Network Interception**: Can mock API responses for deterministic tests
- **Accessibility Testing**: Built-in accessibility snapshot capabilities

### Installation Steps

#### Step 1: Install Playwright and Dependencies

```bash
# Install Playwright with test runner
npm install -D @playwright/test

# Install browsers (Chromium, Firefox, WebKit)
npx playwright install
```

**Why these packages?**
- `@playwright/test` provides the test runner, assertions, and fixtures
- Browser binaries are installed separately to keep the package lightweight

#### Step 2: Create Playwright Configuration

**Before**: No configuration exists

**After**: Create `playwright.config.ts` in the project root

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directory containing test files
  testDir: './e2e',
  
  // Run tests in parallel for faster execution
  fullyParallel: true,
  
  // Fail the build on CI if test.only is left in source code
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests on CI only (flaky test protection)
  retries: process.env.CI ? 2 : 0,
  
  // Number of parallel workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for navigation - matches Next.js dev server
    baseURL: 'http://localhost:3000',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Capture trace on first retry
    trace: 'on-first-retry',
    
    // Respect prefers-reduced-motion for animation tests
    reducedMotion: 'no-preference',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Run Next.js dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for Next.js to start
  },
});
```

**Why each configuration choice:**

| Option | Value | Reason |
|--------|-------|--------|
| `testDir: './e2e'` | Separate from unit tests | Clear separation of concerns; E2E tests have different patterns |
| `fullyParallel: true` | Enabled | Speeds up test execution; each test is isolated |
| `forbidOnly: !!process.env.CI` | CI-only | Prevents accidental `.only` commits breaking CI |
| `retries: process.env.CI ? 2 : 0` | 2 on CI | Handles flaky network/timing issues in CI |
| `baseURL` | localhost:3000 | Matches Next.js default dev server port |
| `screenshot: 'only-on-failure'` | Failure only | Saves disk space; screenshots help debugging |
| `trace: 'on-first-retry'` | First retry | Captures detailed timeline for flaky test analysis |
| `webServer.command` | `npm run dev` | Auto-starts Next.js; no manual server management |
| `webServer.reuseExistingServer` | Not on CI | Dev: reuse existing server; CI: fresh instance |

#### Step 3: Create Test Directory Structure

**Before**: No test structure

**After**: Create the following structure

```
e2e/
├── fixtures/
│   └── test-fixtures.ts      # Custom fixtures and page objects
├── tests/
│   ├── modal.spec.ts         # Modal behavior tests
│   ├── overlay.spec.ts       # Start overlay tests
│   └── keyboard.spec.ts      # Keyboard shortcut tests
└── utils/
    └── test-helpers.ts       # Shared test utilities
```

**Why this structure?**
- `fixtures/`: Reusable test setup (e.g., pre-typed text state)
- `tests/`: Grouped by feature for maintainability
- `utils/`: Shared helpers reduce code duplication

#### Step 4: Add npm Scripts

**Before** (current package.json scripts):
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "format": "biome format . --write"
  }
}
```

**After** (with Playwright scripts):
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "format": "biome format . --write",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

**Why each script?**
- `test:e2e`: Standard test run for CI/CD
- `test:e2e:ui`: Visual UI mode for interactive debugging
- `test:e2e:debug`: Step-through debugging with DevTools
- `test:e2e:report`: View HTML test report

#### Step 5: Create Base Test Fixture

**Before**: No fixtures

**After**: Create `e2e/fixtures/test-fixtures.ts`

```typescript
// e2e/fixtures/test-fixtures.ts
import { test as base, expect } from '@playwright/test';

// Extend base test with typing test-specific fixtures
export const test = base.extend<{
  // Fixture to wait for passage to load
  loadedPage: void;
  // Fixture to complete a typing test
  completedTest: void;
}>({
  // Ensure passage is loaded before each test
  loadedPage: async ({ page }, use) => {
    await page.goto('/');
    // Wait for passage text to appear (not loading state)
    await page.waitForSelector('[data-testid="passage-text"]', {
      state: 'visible',
      timeout: 10000
    });
    await use();
  },
  
  // Complete a full typing test
  completedTest: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="passage-text"]');
    
    // Get passage text and type it
    const passageText = await page.textContent('[data-testid="passage-text"]');
    if (passageText) {
      const input = page.locator('input[aria-label="Typing input"]');
      await input.focus();
      await input.fill(passageText);
    }
    
    // Wait for modal to appear
    await page.waitForSelector('[data-testid="results-modal"]', {
      state: 'visible'
    });
    
    await use();
  }
});

export { expect };
```

**Why custom fixtures?**
- **Reusability**: Common setup patterns defined once
- **Isolation**: Each test starts from a known state
- **Readability**: Test code focuses on assertions, not setup

---

## 2. Modal Exit Prevention Logic

### Problem Statement

The results modal must not be dismissible by accident. Users often press Escape or click outside modals by habit, which would lose their test results and break the user experience.

### Allowed Exit Methods

| Action | Allowed | Implementation Location |
|--------|---------|------------------------|
| Click "Try Again" button | ✅ Yes | `ResultsModal.tsx` button onClick |
| Click "New Passage" button | ✅ Yes | `ResultsModal.tsx` button onClick |
| Press `Ctrl+R` (Reset) | ✅ Yes | `useKeyboardShortcuts` hook |
| Press `Ctrl+N` (New Passage) | ✅ Yes | `useKeyboardShortcuts` hook |
| Press `Escape` | ❌ No | Must be blocked |
| Click backdrop/outside | ❌ No | Must be blocked |
| Browser back button | ❌ No | Should be handled |

### Current Implementation Analysis

**Current Code** (from `ResultsModel.tsx` lines 101-108):
```tsx
{/* Backdrop */}
<button
  ref={backdropRef}
  className="absolute inset-0 bg-FemNeutral-900"
  onClick={handleClose}  // ⚠️ PROBLEM: Backdrop click closes modal
  type="button"
  aria-label="Close modal"
/>
```

**Problem**: The backdrop currently calls `handleClose()` on click, allowing accidental dismissal.

### Proposed Logic Changes

#### 2.1 Block Backdrop Click

**Before** (current behavior):
```tsx
<button
  ref={backdropRef}
  className="absolute inset-0 bg-FemNeutral-900"
  onClick={handleClose}  // Closes on click
  type="button"
  aria-label="Close modal"
/>
```

**After** (proposed behavior):
```tsx
<div
  ref={backdropRef}
  className="absolute inset-0 bg-FemNeutral-900"
  aria-hidden="true"  // Not interactive
/>
```

**Why this change?**
- **Changed from `<button>` to `<div>`**: Non-interactive element cannot receive click events
- **Removed onClick handler**: No accidental dismissal path
- **Added `aria-hidden="true"`**: Screen readers ignore decorative backdrop
- **Simpler**: No need for click event prevention logic

#### 2.2 Block Escape Key

**Location**: New effect should be added in `ResultsModal.tsx`

**Before** (no Escape key handling):
```tsx
// No Escape key prevention exists
```

**After** (proposed logic):
```tsx
// Add effect to block Escape key when modal is open
useEffect(() => {
  if (!isOpen) return;
  
  const handleKeyDown = (event: KeyboardEvent) => {
    // Block Escape key - modal can only be closed via explicit actions
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      // Optional: Provide visual feedback (e.g., shake animation)
      return;
    }
  };
  
  // Use capture phase to intercept before other handlers
  document.addEventListener('keydown', handleKeyDown, { capture: true });
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown, { capture: true });
  };
}, [isOpen]);
```

**Why this approach?**
- **Capture phase (`{ capture: true }`)**: Intercepts event before it bubbles, preventing other handlers from seeing it
- **`event.stopPropagation()`**: Prevents event from reaching other listeners
- **Cleanup on unmount**: No memory leaks or stale handlers
- **Only active when modal is open**: No global key blocking

#### 2.3 Integration with Existing Keyboard Shortcuts

**Current keyboard shortcuts** (from `keyboard-shortcuts.ts`):
```typescript
export const KEYBOARD_SHORTCUTS = {
  START_TEST: { ctrlKey: false, key: "enter", description: "Start Test" },
  RESET_TEST: { ctrlKey: true, key: "r", description: "Reset Test" },
  NEW_PASSAGE: { ctrlKey: true, key: "n", description: "New Passage" },
  CANCEL_TEST: { ctrlKey: true, key: "c", description: "Cancel Test" },
} as const;
```

**Proposed additional shortcut handling in modal**:

The modal should handle `Ctrl+R` and `Ctrl+N` even when focused, allowing proper exit:

**Before** (shortcuts only work via GameContext):
```tsx
// ResultsModal has no direct shortcut handling
```

**After** (modal listens for allowed shortcuts):
```tsx
useEffect(() => {
  if (!isOpen) return;
  
  const handleKeyDown = (event: KeyboardEvent) => {
    const isCtrlOrMeta = event.ctrlKey || event.metaKey;
    
    // Block Escape
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    // Allow Ctrl+R (Reset) - close modal and reset test
    if (isCtrlOrMeta && event.key.toLowerCase() === 'r') {
      event.preventDefault();
      game.resetTest();
      handleClose();
      return;
    }
    
    // Allow Ctrl+N (New Passage) - close modal and fetch new passage
    if (isCtrlOrMeta && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      game.fetchNewPassage();
      handleClose();
      return;
    }
  };
  
  document.addEventListener('keydown', handleKeyDown, { capture: true });
  return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
}, [isOpen, game, handleClose]);
```

**Why this approach?**
- **Centralized handling**: Modal controls its own exit behavior
- **Consistent UX**: Same shortcuts work whether modal is focused or not
- **Clear intent**: Only deliberate actions close the modal

#### 2.4 Prevent Browser Back Button

**Before** (no history management):
```tsx
// Browser back navigates away from page
```

**After** (proposed history state management):
```tsx
useEffect(() => {
  if (!isOpen) return;
  
  // Push a dummy history state when modal opens
  window.history.pushState({ modal: 'results' }, '');
  
  const handlePopState = (event: PopStateEvent) => {
    // Prevent back navigation by re-pushing state
    if (event.state?.modal !== 'results') {
      window.history.pushState({ modal: 'results' }, '');
    }
  };
  
  window.addEventListener('popstate', handlePopState);
  
  return () => {
    window.removeEventListener('popstate', handlePopState);
    // Clean up history state on proper close
    if (window.history.state?.modal === 'results') {
      window.history.back();
    }
  };
}, [isOpen]);
```

**Why this approach?**
- **Non-intrusive**: Doesn't change URL, just prevents navigation
- **Cleanup on close**: Removes dummy state when modal closes properly
- **User expectation**: Back button often means "go back" not "close modal"

### Accessibility Considerations

| Concern | Solution |
|---------|----------|
| Focus trapping | Modal should trap focus within itself using `inert` attribute on background content |
| Screen reader announcement | Use `role="dialog"` and `aria-modal="true"` |
| Escape key expectation | Provide clear visual instruction that Escape doesn't close |
| Keyboard navigation | Ensure Tab cycles through modal buttons only |

**Proposed focus trap implementation**:
```tsx
// When modal opens, add inert to main content
useEffect(() => {
  if (!isOpen) return;
  
  const mainContent = document.querySelector('main');
  if (mainContent) {
    mainContent.setAttribute('inert', '');
  }
  
  return () => {
    if (mainContent) {
      mainContent.removeAttribute('inert');
    }
  };
}, [isOpen]);
```

**Why `inert` attribute?**
- **Native browser support**: No JavaScript focus management needed
- **Complete isolation**: Prevents all interaction with background content
- **Screen reader friendly**: Content is hidden from assistive technology

---

## 3. Modal Text Logic

### Problem Statement

The modal must display contextually appropriate messages based on the user's performance history. This creates a more engaging experience by acknowledging achievements and encouraging continued improvement.

### State Derivation Logic

#### 3.1 Define Test Result Types

```typescript
type TestResultType = 'baseline' | 'new-best' | 'normal';
```

#### 3.2 State Derivation Function

**Before** (current simple check in `ResultsModel.tsx` line 98):
```tsx
const isNewBest = game.wpm > (game.statistics.bestWPM || 0);
```

**After** (proposed comprehensive derivation):
```typescript
interface ModalTextConfig {
  heading: string;
  subheading: string;
  emoji?: string;
}

function deriveTestResultType(
  currentWPM: number,
  statistics: UserStatistics
): TestResultType {
  // Case 1: First test ever (baseline)
  // totalTests is 0 before this test is saved, or 1 if just saved
  // We check if this is the user's first completed test
  const isFirstTest = statistics.totalTests === 0 || 
    (statistics.totalTests === 1 && statistics.bestWPM === currentWPM);
  
  if (isFirstTest) {
    return 'baseline';
  }
  
  // Case 2: New personal best
  // Current WPM exceeds the previous best
  const isNewBest = currentWPM > statistics.bestWPM;
  
  if (isNewBest) {
    return 'new-best';
  }
  
  // Case 3: Normal completion
  return 'normal';
}

function getModalTextConfig(resultType: TestResultType): ModalTextConfig {
  const configs: Record<TestResultType, ModalTextConfig> = {
    'baseline': {
      heading: 'Baseline Established!',
      subheading: "You've set the bar. Now the real challenge begins—time to beat it.",
      emoji: '🎯'
    },
    'new-best': {
      heading: 'High Score Smashed!',
      subheading: "You're getting faster. That was incredible typing.",
      emoji: '🎉'
    },
    'normal': {
      heading: 'Test Complete!',
      subheading: 'Solid run. Keep pushing to beat your high score.',
      emoji: undefined
    }
  };
  
  return configs[resultType];
}
```

**Why this design?**

| Decision | Reason |
|----------|--------|
| Separate `deriveTestResultType` function | Single responsibility; testable in isolation |
| Explicit type union | TypeScript ensures all cases are handled |
| Config object pattern | Easy to add new result types or modify text |
| Emoji as optional | Normal completions don't need celebration |

#### 3.3 Usage in Component

**Before** (current `ResultsModel.tsx` lines 117-125):
```tsx
<h2 className="text-2xl font-bold text-FemBlue-400 mb-6 text-center">
  Test Complete! {isNewBest && "🎉"}
</h2>

{isNewBest && (
  <p className="text-emerald-400 text-center mb-4 font-semibold">
    New Personal Best!
  </p>
)}
```

**After** (proposed implementation):
```tsx
// At the top of the component, derive the state
const resultType = deriveTestResultType(game.wpm, game.statistics);
const textConfig = getModalTextConfig(resultType);

// In the JSX
<h2 className="text-2xl font-bold text-FemBlue-400 mb-6 text-center">
  {textConfig.heading} {textConfig.emoji}
</h2>

<p className={cn(
  "text-center mb-4 font-semibold",
  resultType === 'new-best' ? "text-emerald-400" : 
  resultType === 'baseline' ? "text-FemBlue-400" : 
  "text-FemNeutral-400"
)}>
  {textConfig.subheading}
</p>
```

**Why this refactor?**
- **Single source of truth**: Text defined in one place
- **Consistent styling**: Color tied to result type
- **Extensibility**: Adding new result types only requires updating the config

#### 3.4 Edge Cases

| Scenario | Handling |
|----------|----------|
| Statistics not yet loaded | Default to 'normal' type |
| WPM is 0 (user didn't type) | Still show 'normal' - don't punish |
| Tie with previous best | 'normal' (must beat, not match) |
| Statistics cleared mid-session | Next test becomes 'baseline' |

**Robust derivation with edge cases**:
```typescript
function deriveTestResultType(
  currentWPM: number,
  statistics: UserStatistics | null
): TestResultType {
  // Guard: No statistics available
  if (!statistics) {
    return 'normal';
  }
  
  // Guard: Invalid WPM (shouldn't happen, but be defensive)
  if (currentWPM <= 0) {
    return 'normal';
  }
  
  // Case 1: First test (baseline)
  if (statistics.totalTests === 0) {
    return 'baseline';
  }
  
  // Case 2: New best (must exceed, not equal)
  if (currentWPM > statistics.bestWPM) {
    return 'new-best';
  }
  
  // Case 3: Normal completion
  return 'normal';
}
```

---

## 4. Overlay Blur Behavior

### Problem Statement

The start overlay with blur effect should:
1. Appear only on the first visit in a browser session
2. Reset when the page is reloaded or a new session starts
3. NOT persist across browser sessions (no localStorage)
4. Cover the entire passage area without visual cropping

### Current Implementation Analysis

**Current Code** (from `StartOverlay.tsx` lines 15-31):
```tsx
// Track whether this is the first visit in the current session.
const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true);

useEffect(() => {
  // Read sessionStorage on mount
  const seen =
    typeof window !== "undefined"
      ? sessionStorage.getItem("seenStartOverlay")
      : null;
  setIsFirstVisit(!seen);
}, []);

// If the user starts typing, mark the overlay as seen.
useEffect(() => {
  if (game.testStatus === "running" && isFirstVisit) {
    sessionStorage.setItem("seenStartOverlay", "true");
    setIsFirstVisit(false);
  }
}, [game.testStatus, isFirstVisit]);
```

**Current CSS** (from `StartOverlay.tsx` line 115):
```tsx
className="absolute w-full h-full inset-0 z-20 flex flex-col items-center justify-center bg-FemNeutral-900/10 backdrop-blur-sm"
```

### Why Session Storage (Not Local Storage)

| Storage Type | Persistence | Use Case |
|--------------|-------------|----------|
| `sessionStorage` | Tab/window lifetime | ✅ Overlay state - resets on new session |
| `localStorage` | Permanent until cleared | ❌ Would permanently hide overlay |
| Cookie | Configurable expiry | ❌ Overkill for this use case |
| Memory (useState) | Component lifetime | ❌ Would reset on every navigation |

**Why session-scoped storage is correct:**

1. **New users see instructions**: First-time visitors get the "Start typing test" prompt
2. **Returning users aren't annoyed**: After starting once, overlay doesn't reappear during session
3. **Page reload resets**: Refreshing the page in a new tab shows the overlay again
4. **No permanent storage**: User's browser isn't cluttered with persistent data

### Blur Cropping Issue

**Problem**: The current overlay uses `absolute` positioning with `inset-0`, but it may appear cropped if the parent container has `overflow: hidden` or insufficient height.

**Current parent structure** (from `TypingTestContainter.tsx` lines 33-42):
```tsx
if (game.testStatus === "idle" || game.testStatus === "ready") {
  return (
    <div className="w-full h-full mx-auto mt-8 text-pretty">
      <div className="relative h-full">  {/* ← Parent of overlay */}
        <PassageDisplay />
        <TypingInput />
        <StartOverlay />
      </div>
    </div>
  );
}
```

**Before** (current overlay positioning):
```tsx
<div
  ref={overlayRef}
  className="absolute w-full h-full inset-0 z-20 flex flex-col items-center justify-center bg-FemNeutral-900/10 backdrop-blur-sm"
  style={{
    opacity: isVisible ? 1 : 0,
    display: isVisible ? "flex" : "none",
  }}
>
```

**After** (proposed fix for blur cropping):
```tsx
<div
  ref={overlayRef}
  className="absolute z-20 flex flex-col items-center justify-center bg-FemNeutral-900/10 backdrop-blur-sm"
  style={{
    // Expand beyond parent bounds to prevent cropping
    top: '-1rem',
    left: '-1rem',
    right: '-1rem',
    bottom: '-1rem',
    // Or use negative margins with padding compensation
    // margin: '-1rem',
    // padding: '1rem',
    opacity: isVisible ? 1 : 0,
    display: isVisible ? "flex" : "none",
  }}
>
```

**Alternative: Fix parent container**

If the issue is `overflow: hidden` on a parent, the parent should be adjusted:

**Before** (hypothetical parent with overflow issues):
```tsx
<div className="relative h-full overflow-hidden">
```

**After** (allow overlay to extend):
```tsx
<div className="relative h-full overflow-visible">
```

**Why these solutions work:**

1. **Negative inset values**: Overlay extends beyond parent bounds, ensuring blur covers edges
2. **`overflow-visible`**: Parent doesn't clip child elements
3. **Padding compensation**: If using negative margins, inner content stays properly positioned

### Complete Session Storage Logic Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Page Load                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Check sessionStorage.getItem("seenStartOverlay")           │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        [null/undefined]          ["true"]
              │                         │
              ▼                         ▼
    ┌─────────────────┐       ┌─────────────────┐
    │ isFirstVisit =  │       │ isFirstVisit =  │
    │     true        │       │     false       │
    └─────────────────┘       └─────────────────┘
              │                         │
              ▼                         ▼
    ┌─────────────────┐       ┌─────────────────┐
    │ Show Overlay    │       │ Hide Overlay    │
    │ (blur + button) │       │ (go straight    │
    └─────────────────┘       │  to test)       │
              │               └─────────────────┘
              ▼
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Start" OR starts typing                       │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  sessionStorage.setItem("seenStartOverlay", "true")         │
│  setIsFirstVisit(false)                                     │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Subsequent passage changes / retries:                      │
│  Overlay stays hidden (sessionStorage persists)             │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Close tab / Open in new tab / Page reload:                 │
│  sessionStorage clears → Overlay shows again                │
└─────────────────────────────────────────────────────────────┘
```

### Why NOT Persistent Storage

Using `localStorage` would cause these issues:

1. **Returning users never see instructions again**: If a user clears cookies but not localStorage, they'd miss the overlay
2. **New device, old browser profile**: User on new computer with synced profile would miss overlay
3. **Cannot test/demo overlay**: Developers/QA would need to manually clear storage
4. **GDPR considerations**: Persistent storage may require consent in some jurisdictions

**sessionStorage is the correct choice** because:
- Automatically clears when session ends
- No user data persistence concerns
- Easy to reset by opening new tab
- Matches user expectation: "I visited before in this tab"

---

## 5. Playwright Tests

### Test File Structure

```
e2e/
├── tests/
│   ├── modal-exit-prevention.spec.ts
│   ├── modal-text-content.spec.ts
│   ├── overlay-behavior.spec.ts
│   └── keyboard-shortcuts.spec.ts
```

### 5.1 Modal Exit Prevention Tests

**File**: `e2e/tests/modal-exit-prevention.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Results Modal Exit Prevention', () => {
  // Helper to complete a typing test and open the modal
  async function completeTestAndOpenModal(page: Page) {
    await page.goto('/');
    
    // Wait for passage to load
    await page.waitForSelector('[data-testid="passage-text"]');
    
    // Get passage text
    const passageText = await page.textContent('[data-testid="passage-text"]');
    
    // Type the full passage to complete the test
    const input = page.locator('input[aria-label="Typing input"]');
    await input.focus();
    await input.fill(passageText || '');
    
    // Wait for results modal to appear
    await page.waitForSelector('[data-testid="results-modal"]', {
      state: 'visible',
      timeout: 5000
    });
  }

  test('Escape key should NOT close the modal', async ({ page }) => {
    await completeTestAndOpenModal(page);
    
    // Verify modal is visible
    const modal = page.locator('[data-testid="results-modal"]');
    await expect(modal).toBeVisible();
    
    // Press Escape key
    await page.keyboard.press('Escape');
    
    // Modal should still be visible
    await expect(modal).toBeVisible();
    
    // Verify we're still on the completed state
    const heading = page.locator('[data-testid="results-modal"] h2');
    await expect(heading).toBeVisible();
  });

  test('Clicking outside modal (backdrop) should NOT close it', async ({ page }) => {
    await completeTestAndOpenModal(page);
    
    const modal = page.locator('[data-testid="results-modal"]');
    await expect(modal).toBeVisible();
    
    // Click on the backdrop (outside the modal content)
    // The backdrop should be a sibling or parent element
    await page.click('[data-testid="modal-backdrop"]', {
      position: { x: 10, y: 10 }, // Click near edge, away from modal content
      force: true // Click even if another element would receive the click
    });
    
    // Modal should still be visible
    await expect(modal).toBeVisible();
  });

  test('Browser back button should NOT close the modal', async ({ page }) => {
    await completeTestAndOpenModal(page);
    
    const modal = page.locator('[data-testid="results-modal"]');
    await expect(modal).toBeVisible();
    
    // Try to go back
    await page.goBack();
    
    // Modal should still be visible (history state prevents navigation)
    await expect(modal).toBeVisible();
    
    // URL should still be the same
    expect(page.url()).toContain('localhost:3000');
  });

  test('Try Again button SHOULD close modal and reset test', async ({ page }) => {
    await completeTestAndOpenModal(page);
    
    // Click Try Again button
    await page.click('button:has-text("Try Again")');
    
    // Modal should close
    const modal = page.locator('[data-testid="results-modal"]');
    await expect(modal).not.toBeVisible();
    
    // Test should be reset (ready state, input cleared)
    const input = page.locator('input[aria-label="Typing input"]');
    await expect(input).toHaveValue('');
  });

  test('New Passage button SHOULD close modal and load new passage', async ({ page }) => {
    await completeTestAndOpenModal(page);
    
    // Get current passage text before clicking
    const originalPassage = await page.textContent('[data-testid="passage-text"]');
    
    // Click New Passage button
    await page.click('button:has-text("New Passage")');
    
    // Modal should close
    const modal = page.locator('[data-testid="results-modal"]');
    await expect(modal).not.toBeVisible();
    
    // Wait for new passage to load
    await page.waitForSelector('[data-testid="passage-text"]');
    
    // Note: New passage might be the same by chance, but input should be cleared
    const input = page.locator('input[aria-label="Typing input"]');
    await expect(input).toHaveValue('');
  });
});
```

**Why each test exists:**

| Test | Purpose |
|------|---------|
| Escape key test | Verifies accidental key press doesn't lose results |
| Backdrop click test | Verifies mouse misclicks don't dismiss modal |
| Back button test | Verifies browser navigation doesn't break flow |
| Try Again test | Verifies legitimate exit path works |
| New Passage test | Verifies legitimate exit path works |

### 5.2 Modal Text Content Tests

**File**: `e2e/tests/modal-text-content.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Results Modal Text Content', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('First test should show "Baseline Established!" message', async ({ page }) => {
    // Ensure no previous statistics exist
    await page.evaluate(() => {
      localStorage.removeItem('typingTestStatistics');
    });
    
    await page.reload();
    await page.waitForSelector('[data-testid="passage-text"]');
    
    // Complete the test
    const passageText = await page.textContent('[data-testid="passage-text"]');
    const input = page.locator('input[aria-label="Typing input"]');
    await input.focus();
    await input.fill(passageText || '');
    
    // Wait for modal
    await page.waitForSelector('[data-testid="results-modal"]');
    
    // Check for baseline message
    const heading = page.locator('[data-testid="results-modal"] h2');
    await expect(heading).toContainText('Baseline Established!');
    
    const subheading = page.locator('[data-testid="results-modal"] p').first();
    await expect(subheading).toContainText("You've set the bar");
  });

  test('New personal best should show "High Score Smashed!" message', async ({ page }) => {
    // Set up existing statistics with a low WPM
    await page.evaluate(() => {
      const stats = {
        totalTests: 5,
        bestWPM: 10, // Very low, easy to beat
        bestAccuracy: 80,
        averageWPM: 8,
        averageAccuracy: 75,
        recentTests: [],
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('typingTestStatistics', JSON.stringify(stats));
    });
    
    await page.reload();
    await page.waitForSelector('[data-testid="passage-text"]');
    
    // Complete the test (any reasonable typing should beat 10 WPM)
    const passageText = await page.textContent('[data-testid="passage-text"]');
    const input = page.locator('input[aria-label="Typing input"]');
    await input.focus();
    await input.fill(passageText || '');
    
    // Wait for modal
    await page.waitForSelector('[data-testid="results-modal"]');
    
    // Check for new best message
    const heading = page.locator('[data-testid="results-modal"] h2');
    await expect(heading).toContainText('High Score Smashed!');
    
    const subheading = page.locator('[data-testid="results-modal"] p').first();
    await expect(subheading).toContainText("You're getting faster");
  });

  test('Normal completion should show "Test Complete!" message', async ({ page }) => {
    // Set up existing statistics with a very high WPM (impossible to beat)
    await page.evaluate(() => {
      const stats = {
        totalTests: 10,
        bestWPM: 500, // Impossible to beat with fill()
        bestAccuracy: 100,
        averageWPM: 400,
        averageAccuracy: 98,
        recentTests: [],
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('typingTestStatistics', JSON.stringify(stats));
    });
    
    await page.reload();
    await page.waitForSelector('[data-testid="passage-text"]');
    
    // Complete the test
    const passageText = await page.textContent('[data-testid="passage-text"]');
    const input = page.locator('input[aria-label="Typing input"]');
    await input.focus();
    await input.fill(passageText || '');
    
    // Wait for modal
    await page.waitForSelector('[data-testid="results-modal"]');
    
    // Check for normal completion message
    const heading = page.locator('[data-testid="results-modal"] h2');
    await expect(heading).toContainText('Test Complete!');
    
    const subheading = page.locator('[data-testid="results-modal"] p').first();
    await expect(subheading).toContainText('Solid run');
  });
});
```

**Why each test exists:**

| Test | Purpose |
|------|---------|
| Baseline test | Verifies first-time user experience |
| New best test | Verifies achievement recognition works |
| Normal test | Verifies default state works correctly |

### 5.3 Overlay Behavior Tests

**File**: `e2e/tests/overlay-behavior.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Start Overlay Behavior', () => {
  test('Overlay should appear on first visit', async ({ page }) => {
    // Clear session storage to simulate first visit
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="passage-text"]');
    
    // Overlay should be visible
    const overlay = page.locator('[data-testid="start-overlay"]');
    await expect(overlay).toBeVisible();
    
    // Button should be present
    const startButton = page.locator('button:has-text("Start typing test")');
    await expect(startButton).toBeVisible();
  });

  test('Overlay should have blur effect', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    
    await page.waitForSelector('[data-testid="start-overlay"]');
    
    // Check that backdrop-blur class is applied
    const overlay = page.locator('[data-testid="start-overlay"]');
    const hasBlur = await overlay.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.backdropFilter.includes('blur') || 
             el.classList.contains('backdrop-blur-sm');
    });
    
    expect(hasBlur).toBe(true);
  });

  test('Overlay should disappear after clicking Start button', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    
    await page.waitForSelector('[data-testid="start-overlay"]');
    
    // Click the start button
    await page.click('button:has-text("Start typing test")');
    
    // Overlay should disappear
    const overlay = page.locator('[data-testid="start-overlay"]');
    await expect(overlay).not.toBeVisible();
  });

  test('Overlay should disappear when user starts typing', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    
    await page.waitForSelector('[data-testid="start-overlay"]');
    
    // Focus input and type
    const input = page.locator('input[aria-label="Typing input"]');
    await input.focus();
    await input.type('a'); // Type single character
    
    // Overlay should disappear
    const overlay = page.locator('[data-testid="start-overlay"]');
    await expect(overlay).not.toBeVisible();
  });

  test('Overlay should NOT reappear after retry', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    
    // Start the test (dismiss overlay)
    await page.waitForSelector('[data-testid="start-overlay"]');
    await page.click('button:has-text("Start typing test")');
    
    // Complete a test
    const passageText = await page.textContent('[data-testid="passage-text"]');
    const input = page.locator('input[aria-label="Typing input"]');
    await input.fill(passageText || '');
    
    // Click Try Again
    await page.waitForSelector('[data-testid="results-modal"]');
    await page.click('button:has-text("Try Again")');
    
    // Overlay should NOT be visible
    const overlay = page.locator('[data-testid="start-overlay"]');
    await expect(overlay).not.toBeVisible();
  });

  test('Overlay should NOT reappear after selecting new passage', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    
    // Start the test
    await page.waitForSelector('[data-testid="start-overlay"]');
    await page.click('button:has-text("Start typing test")');
    
    // Complete a test
    const passageText = await page.textContent('[data-testid="passage-text"]');
    const input = page.locator('input[aria-label="Typing input"]');
    await input.fill(passageText || '');
    
    // Click New Passage
    await page.waitForSelector('[data-testid="results-modal"]');
    await page.click('button:has-text("New Passage")');
    
    // Overlay should NOT be visible
    const overlay = page.locator('[data-testid="start-overlay"]');
    await expect(overlay).not.toBeVisible();
  });

  test('Overlay SHOULD reappear in new browser context (simulating new session)', async ({ browser }) => {
    // First context - dismiss the overlay
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('http://localhost:3000');
    await page1.waitForSelector('[data-testid="start-overlay"]');
    await page1.click('button:has-text("Start typing test")');
    await context1.close();
    
    // Second context - overlay should appear (new session)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('http://localhost:3000');
    
    // Overlay should be visible in new context
    const overlay = page2.locator('[data-testid="start-overlay"]');
    await expect(overlay).toBeVisible();
    
    await context2.close();
  });

  test('Overlay blur should cover entire passage area without cropping', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    
    await page.waitForSelector('[data-testid="start-overlay"]');
    
    const overlay = page.locator('[data-testid="start-overlay"]');
    const passage = page.locator('[data-testid="passage-text"]');
    
    // Get bounding boxes
    const overlayBox = await overlay.boundingBox();
    const passageBox = await passage.boundingBox();
    
    expect(overlayBox).not.toBeNull();
    expect(passageBox).not.toBeNull();
    
    if (overlayBox && passageBox) {
      // Overlay should fully cover passage
      expect(overlayBox.x).toBeLessThanOrEqual(passageBox.x);
      expect(overlayBox.y).toBeLessThanOrEqual(passageBox.y);
      expect(overlayBox.x + overlayBox.width).toBeGreaterThanOrEqual(
        passageBox.x + passageBox.width
      );
      expect(overlayBox.y + overlayBox.height).toBeGreaterThanOrEqual(
        passageBox.y + passageBox.height
      );
    }
  });
});
```

**Why each test exists:**

| Test | Purpose |
|------|---------|
| First visit test | Verifies onboarding experience |
| Blur effect test | Verifies visual styling is applied |
| Start button test | Verifies button dismissal works |
| Typing dismissal test | Verifies auto-start behavior |
| Retry persistence test | Verifies session storage works |
| New passage persistence test | Verifies session storage works |
| New session reset test | Verifies session scope is correct |
| Blur coverage test | Verifies no visual cropping |

### 5.4 Keyboard Shortcut Tests

**File**: `e2e/tests/keyboard-shortcuts.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts', () => {
  test.describe('During Typing Test', () => {
    test('Ctrl+R should reset the current test', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="passage-text"]');
      
      // Start typing
      const input = page.locator('input[aria-label="Typing input"]');
      await input.focus();
      await input.type('Some test text');
      
      // Verify text was entered
      await expect(input).not.toHaveValue('');
      
      // Press Ctrl+R
      await page.keyboard.press('Control+r');
      
      // Input should be cleared (test reset)
      await expect(input).toHaveValue('');
    });

    test('Ctrl+N should load a new passage', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="passage-text"]');
      
      // Get current passage
      const originalPassage = await page.textContent('[data-testid="passage-text"]');
      
      // Press Ctrl+N multiple times (to increase chance of different passage)
      await page.keyboard.press('Control+n');
      await page.waitForTimeout(500); // Wait for fetch
      
      // Input should be cleared
      const input = page.locator('input[aria-label="Typing input"]');
      await expect(input).toHaveValue('');
    });

    test('Ctrl+C should cancel running test', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="passage-text"]');
      
      // Start typing (begins the test)
      const input = page.locator('input[aria-label="Typing input"]');
      await input.focus();
      await input.type('Test');
      
      // Press Ctrl+C to cancel
      await page.keyboard.press('Control+c');
      
      // Test should be reset
      await expect(input).toHaveValue('');
    });
  });

  test.describe('In Results Modal', () => {
    async function completeTest(page: Page) {
      await page.goto('/');
      await page.waitForSelector('[data-testid="passage-text"]');
      const passageText = await page.textContent('[data-testid="passage-text"]');
      const input = page.locator('input[aria-label="Typing input"]');
      await input.focus();
      await input.fill(passageText || '');
      await page.waitForSelector('[data-testid="results-modal"]');
    }

    test('Ctrl+R in modal should close modal and reset test', async ({ page }) => {
      await completeTest(page);
      
      const modal = page.locator('[data-testid="results-modal"]');
      await expect(modal).toBeVisible();
      
      // Press Ctrl+R
      await page.keyboard.press('Control+r');
      
      // Modal should close
      await expect(modal).not.toBeVisible();
      
      // Test should be reset
      const input = page.locator('input[aria-label="Typing input"]');
      await expect(input).toHaveValue('');
    });

    test('Ctrl+N in modal should close modal and load new passage', async ({ page }) => {
      await completeTest(page);
      
      const modal = page.locator('[data-testid="results-modal"]');
      await expect(modal).toBeVisible();
      
      // Press Ctrl+N
      await page.keyboard.press('Control+n');
      
      // Modal should close
      await expect(modal).not.toBeVisible();
      
      // Test should be ready with cleared input
      const input = page.locator('input[aria-label="Typing input"]');
      await expect(input).toHaveValue('');
    });

    test('Enter key should NOT close modal', async ({ page }) => {
      await completeTest(page);
      
      const modal = page.locator('[data-testid="results-modal"]');
      await expect(modal).toBeVisible();
      
      // Press Enter
      await page.keyboard.press('Enter');
      
      // Modal should still be visible
      await expect(modal).toBeVisible();
    });
  });

  test.describe('Keyboard Shortcut Display', () => {
    test('Modal should display keyboard shortcut hints', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="passage-text"]');
      
      // Complete test
      const passageText = await page.textContent('[data-testid="passage-text"]');
      const input = page.locator('input[aria-label="Typing input"]');
      await input.fill(passageText || '');
      
      await page.waitForSelector('[data-testid="results-modal"]');
      
      // Check for keyboard shortcut hints
      const ctrlRHint = page.locator('kbd:has-text("Ctrl+R")');
      const ctrlNHint = page.locator('kbd:has-text("Ctrl+N")');
      
      await expect(ctrlRHint).toBeVisible();
      await expect(ctrlNHint).toBeVisible();
    });
  });
});
```

**Why each test exists:**

| Test | Purpose |
|------|---------|
| Ctrl+R reset test | Verifies reset shortcut during typing |
| Ctrl+N new passage test | Verifies passage change shortcut |
| Ctrl+C cancel test | Verifies test cancellation works |
| Ctrl+R in modal test | Verifies shortcut works in modal |
| Ctrl+N in modal test | Verifies shortcut works in modal |
| Enter in modal test | Verifies Enter doesn't accidentally close |
| Shortcut hints test | Verifies UI shows available shortcuts |

---

## Appendix A: Required Test IDs

For the Playwright tests to work, the following `data-testid` attributes must be added to components:

| Component | Test ID | Element |
|-----------|---------|---------|
| PassageDisplay | `passage-text` | Container with passage text |
| ResultsModal | `results-modal` | Modal container |
| ResultsModal | `modal-backdrop` | Backdrop element |
| StartOverlay | `start-overlay` | Overlay container |

**Note**: These test IDs would need to be added to the actual components when implementing the tests.

---

## Appendix B: Assumptions Made

1. **Statistics Storage**: Assumed that `UserStatistics` is stored in `localStorage` with key `typingTestStatistics` (based on common patterns; actual implementation may vary)

2. **Test Completion Detection**: Assumed that completing all characters triggers the modal (based on code in `GameContext.tsx` line 257-269)

3. **Passage API**: Assumed passages are fetched from `/api/passages/action` endpoint (based on `fetchNewPassage` in `GameContext.tsx`)

4. **Timer Behavior**: Assumed timed mode uses 60-second duration (based on `GameContext.tsx` line 98)

5. **Modal Animation**: Assumed GSAP animations complete within reasonable timeframes for test assertions

---

## Appendix C: Test Data-TestId Implementation Guide

When implementing the actual changes, add these attributes:

```tsx
// PassageDisplay.tsx
<div data-testid="passage-text">...</div>

// ResultsModel.tsx
<div data-testid="results-modal" ref={modalRef}>...</div>
<div data-testid="modal-backdrop" ref={backdropRef}>...</div>

// StartOverlay.tsx  
<div data-testid="start-overlay" ref={overlayRef}>...</div>
```

This ensures Playwright tests can reliably locate elements regardless of CSS class changes.
