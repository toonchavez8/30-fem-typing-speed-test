# Typing Test Implementation Guide - Bug Fixes

This guide provides step-by-step instructions to fix the identified issues in the typing test application.

---

## Table of Contents

1. [Issue #1: WPM and Time Not Updating (CRITICAL)](#issue-1-wpm-and-time-not-updating-critical)
2. [Issue #2: Timer Reset Loop in useTimer Hook](#issue-2-timer-reset-loop-in-usetimer-hook)
3. [Issue #3: Personal Best Not Loading from LocalStorage](#issue-3-personal-best-not-loading-from-localstorage)
4. [Issue #4: Results Modal Not Showing](#issue-4-results-modal-not-showing)
5. [Issue #5: Completion Detection Too Strict](#issue-5-completion-detection-too-strict)

---

## Issue #1: WPM and Time Not Updating (CRITICAL)

### Problem Analysis

**Root Cause:** The `onComplete` callback passed to `useTimer` is an **inline anonymous function**:

```typescript
// In GameContext.tsx (around line 97-103)
const timer = useTimer({
    duration: mode === "timed" ? 60 : null,
    autoStart: false,
    onComplete: () => {           // ← THIS IS THE PROBLEM!
        setTestStatus("completed");
    },
});
```

This causes a **cascade of function recreations** on every render:

1. `onComplete` is a new function reference every render
2. `runTick` callback depends on `onComplete` → gets recreated
3. `startInterval` depends on `runTick` → gets recreated  
4. `start` depends on `startInterval` → gets recreated
5. The `useEffect` in `useTimer` has `start` in dependencies
6. When `start` changes, the effect runs and calls `reset()` (since `autoStart=false`)
7. **The timer resets on EVERY render, so `elapsedMs` always stays at 0!**

This is why:
- **WPM stays at 0** (because `elapsedMs` is 0, and `calculateWPM` returns 0 to avoid division by zero)
- **Time stays at "0:00"** (because `elapsedMs` is 0)
- **Accuracy DOES update** (because it only depends on character counts, not time)

### Solution

Wrap `onComplete` in `useCallback` to create a **stable function reference**.

**File:** `src/components/GameContext.tsx`

**Step 1:** Find this code (around lines 97-103):

```typescript
// timer integration

const timer = useTimer({
    duration: mode === "timed" ? 60 : null,
    autoStart: false,
    onComplete: () => {
        setTestStatus("completed");
    },
});
```

**Step 2:** Replace with this fixed code:

```typescript
// timer integration

// IMPORTANT: Wrap in useCallback to prevent timer reset on every render!
const handleTimerComplete = useCallback(() => {
    setTestStatus("completed");
}, []);

const timer = useTimer({
    duration: mode === "timed" ? 60 : null,
    autoStart: false,
    onComplete: handleTimerComplete,
});
```

**Why this works:** `useCallback` with an empty dependency array `[]` ensures `handleTimerComplete` maintains the same reference across renders. This stops the cascade effect that was resetting the timer.

---

## Issue #2: Timer Reset Loop in useTimer Hook

### Problem Analysis

The `useTimer` hook has a `useEffect` that depends on function references:

```typescript
// In useTimer.ts (around lines 154-165)
useEffect(() => {
    if (autoStart) {
        start();
    } else {
        reset();  // ← This gets called when ANY dependency changes!
    }

    return () => {
        clearTimer();
    };
}, [autoStart, clearTimer, reset, start]);  // ← start changes every render!
```

When `autoStart` is `false` and `start` changes (due to callback chain), this effect runs and calls `reset()`.

### Solution

Modify the `useEffect` to only respond to `autoStart` changes, not function reference changes.

**File:** `src/lib/hooks/useTimer.ts`

**Option A: Use refs for stable function references (Recommended)**

Find this code (around lines 154-165):

```typescript
useEffect(() => {
    if (autoStart) {
        start();
    } else {
        reset();
    }

    return () => {
        clearTimer();
    };
}, [autoStart, clearTimer, reset, start]);
```

Replace with:

```typescript
// Use refs to avoid dependency on function references
const startRef = useRef(start);
const resetRef = useRef(reset);

// Keep refs updated
useEffect(() => {
    startRef.current = start;
    resetRef.current = reset;
});

useEffect(() => {
    if (autoStart) {
        startRef.current();
    }
    // Only reset on mount, not on every autoStart change when false
    // The manual reset() call handles user-initiated resets

    return () => {
        clearTimer();
    };
}, [autoStart, clearTimer]);
```

**Option B: Simpler fix - only run on mount (Quick Fix)**

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
    if (autoStart) {
        start();
    }
    // Removed the else { reset() } to prevent unwanted resets

    return () => {
        clearTimer();
    };
}, [autoStart]); // Only depend on autoStart
```

**Note:** Option B requires an ESLint disable comment but is simpler. Option A is more correct but requires adding `useRef` import.

---

## Issue #3: Personal Best Not Loading from LocalStorage

### Problem Analysis

The `Header` component has a hardcoded value:

```tsx
<strong className=" text-FemNeutral-000">75 WPM</strong>
```

It should read from localStorage.

### Solution

**File:** `src/components/header.tsx`

Replace the entire file with:

```tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getLocalStorage } from "@/lib/utils/storage";
import type { UserStatistics } from "@/lib/types";

const STATISTICS_KEY = "uster-statistics";  // Must match key in useStatistics.ts

const Header = () => {
    const [bestWPM, setBestWPM] = useState<number>(0);

    useEffect(() => {
        // Load bestWPM from localStorage on mount
        const stored = getLocalStorage<UserStatistics | null>(STATISTICS_KEY, null);
        if (stored && typeof stored.bestWPM === "number") {
            setBestWPM(stored.bestWPM);
        }
    }, []);

    // Listen for storage changes (updates when test completes)
    useEffect(() => {
        const handleStorageChange = () => {
            const stored = getLocalStorage<UserStatistics | null>(STATISTICS_KEY, null);
            if (stored && typeof stored.bestWPM === "number") {
                setBestWPM(stored.bestWPM);
            }
        };

        // Also check periodically for same-tab updates (storage event only fires cross-tab)
        const interval = setInterval(handleStorageChange, 1000);
        window.addEventListener("storage", handleStorageChange);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    return (
        <header className="w-full flex items-center justify-between p-4 md:px-16 debug ">
            <figure>
                <Image
                    src="/images/logo-large.svg"
                    alt="Typing test logo"
                    width={240}
                    height={48}
                    className="hidden md:block"
                />
                <Image
                    src="/images/logo-small.svg"
                    alt="Typing test logo small"
                    width={32}
                    height={32}
                    className="block md:hidden"
                />
            </figure>

            <div className="flex items-center gap-2.5 ">
                <figure>
                    <Image
                        src="/images/icon-personal-best.svg"
                        alt="trophy icon"
                        width={18}
                        height={18}
                    />
                </figure>
                <span className="font-normal text-FemNeutral-500 flex gap-2 items-center">
                    <p className="hidden md:block">Personal best:</p>
                    <p className="block md:hidden">Best: </p>
                    <strong className="text-FemNeutral-000">{bestWPM} WPM</strong>
                </span>
            </div>
        </header>
    );
};

export default Header;
```

---

## Issue #4: Results Modal Not Showing

### Problem Analysis

The completed state shows inline results but not a prominent modal overlay.

### Solution

**Step 1:** Create a new modal component.

**File:** `src/components/typing-test/ResultsModal.tsx` (create new file)

```tsx
"use client";

import { useGame } from "@/components/GameContext";

interface ResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ isOpen, onClose }) => {
    const game = useGame();

    if (!isOpen) return null;

    const isNewBest = game.wpm > (game.statistics.bestWPM || 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
                onKeyDown={(e) => e.key === "Escape" && onClose()}
                role="button"
                tabIndex={0}
                aria-label="Close modal"
            />
            
            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-md mx-4 p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl">
                <h2 className="text-2xl font-bold text-FemBlue-400 mb-6 text-center">
                    Test Complete! {isNewBest && "🎉"}
                </h2>

                {isNewBest && (
                    <p className="text-emerald-400 text-center mb-4 font-semibold">
                        New Personal Best!
                    </p>
                )}

                {/* Results Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-900 rounded-lg">
                        <p className="text-gray-400 text-xs uppercase tracking-wide">WPM</p>
                        <p className="text-3xl font-bold text-gray-100">{game.wpm}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-900 rounded-lg">
                        <p className="text-gray-400 text-xs uppercase tracking-wide">Accuracy</p>
                        <p className="text-3xl font-bold text-gray-100">{game.accuracy}%</p>
                    </div>
                    <div className="text-center p-3 bg-gray-900 rounded-lg">
                        <p className="text-gray-400 text-xs uppercase tracking-wide">Time</p>
                        <p className="text-3xl font-bold text-gray-100">{game.time}</p>
                    </div>
                </div>

                {/* Statistics */}
                <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Your Statistics</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-gray-500">Total Tests</p>
                            <p className="text-gray-200 font-semibold">{game.statistics.totalTests}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Best WPM</p>
                            <p className="text-emerald-400 font-semibold">{game.statistics.bestWPM}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Average WPM</p>
                            <p className="text-gray-200 font-semibold">{game.statistics.averageWPM}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Best Accuracy</p>
                            <p className="text-emerald-400 font-semibold">{game.statistics.bestAccuracy}%</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            game.resetTest();
                            onClose();
                        }}
                        className="flex-1 px-6 py-3 bg-FemBlue-400 hover:bg-FemBlue-500 text-black font-semibold rounded-lg transition"
                        type="button"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => {
                            game.fetchNewPassage();
                            onClose();
                        }}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg transition"
                        type="button"
                    >
                        New Passage
                    </button>
                </div>

                {/* Keyboard Shortcuts */}
                <p className="mt-4 text-xs text-gray-500 text-center">
                    Press <kbd className="px-2 py-1 bg-gray-700 rounded">Ctrl+R</kbd> to reset or{" "}
                    <kbd className="px-2 py-1 bg-gray-700 rounded">Ctrl+N</kbd> for new passage
                </p>
            </div>
        </div>
    );
};

export default ResultsModal;
```

**Step 2:** Update `TypingTestContainter.tsx` to use the modal.

Add imports at the top:

```tsx
"use client";

import { useEffect, useState } from "react";  // Add useState and useEffect
import { useGame } from "@/components/GameContext";
import PassageDisplay from "./PassageDisplay";
import TypingInput from "./TypingInput";
import ResultsModal from "./ResultsModal";  // Add this import
```

Add state and effect at the beginning of the component:

```tsx
const TypingTestContainer: React.FC = () => {
    const game = useGame();
    const [showResultsModal, setShowResultsModal] = useState(false);

    // Show modal when test completes
    useEffect(() => {
        if (game.testStatus === "completed") {
            setShowResultsModal(true);
        } else {
            setShowResultsModal(false);
        }
    }, [game.testStatus]);

    // ... rest of component
```

Add the modal at the end of each return statement (or wrap in a fragment):

```tsx
    // At the end, before return null:
    return (
        <>
            {/* Keep your existing completed state JSX */}
            <ResultsModal 
                isOpen={showResultsModal} 
                onClose={() => setShowResultsModal(false)} 
            />
        </>
    );
```

---

## Issue #5: Completion Detection Too Strict

### Problem Analysis

In `GameContext.tsx`, the completion check requires ALL characters to be correct:

```typescript
if (
    passage &&
    value.length === passage.text.length &&
    characterStates.every((s) => s.state === "correct")  // ← Too strict!
) {
```

This means if you have ANY typos, the test never completes.

### Solution

**File:** `src/components/GameContext.tsx`

Find the completion check in `handleTyping` (around line 217-221):

```typescript
// Check completion
if (
    passage &&
    value.length === passage.text.length &&
    characterStates.every((s) => s.state === "correct")
) {
```

Replace with:

```typescript
// Check completion - complete when all characters typed (regardless of errors)
if (passage && value.length === passage.text.length) {
```

---

## Summary of All Changes Required

| Priority | File | Change |
|----------|------|--------|
| **CRITICAL** | `src/components/GameContext.tsx` | Wrap `onComplete` in `useCallback` |
| HIGH | `src/lib/hooks/useTimer.ts` | Fix useEffect dependencies to prevent reset loop |
| HIGH | `src/components/GameContext.tsx` | Remove `.every()` check from completion logic |
| MEDIUM | `src/components/header.tsx` | Add "use client", load bestWPM from localStorage |
| MEDIUM | `src/components/typing-test/ResultsModal.tsx` | Create new modal component |
| MEDIUM | `src/components/typing-test/TypingTestContainter.tsx` | Add modal state and render ResultsModal |

---

## Quick Fix Summary

**The MOST IMPORTANT fix** is in `GameContext.tsx`. Change this:

```typescript
const timer = useTimer({
    duration: mode === "timed" ? 60 : null,
    autoStart: false,
    onComplete: () => {
        setTestStatus("completed");
    },
});
```

To this:

```typescript
const handleTimerComplete = useCallback(() => {
    setTestStatus("completed");
}, []);

const timer = useTimer({
    duration: mode === "timed" ? 60 : null,
    autoStart: false,
    onComplete: handleTimerComplete,
});
```

This single change should fix both WPM and Time not updating!

---

## Testing Checklist

After implementing these fixes, verify:

- [ ] Timer starts counting when you begin typing
- [ ] WPM updates in real-time as you type
- [ ] Time counts down (timed mode) or up (passage mode)
- [ ] Modal appears when test completes
- [ ] Results in modal show correct WPM, accuracy, and time
- [ ] Personal best updates in header after completing a test with higher WPM
- [ ] Personal best persists after page refresh
- [ ] Test completes even if you have typos
