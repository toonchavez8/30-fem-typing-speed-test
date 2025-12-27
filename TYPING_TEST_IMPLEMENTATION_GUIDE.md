# Typing Test Implementation Guide - COMPREHENSIVE UPDATE

**Project:** Typing Speed Test Application  
**Date:** December 27, 2025  
**Updated:** December 27, 2025 - Enhanced Features + Next.js Architecture Review  
**Purpose:** Complete interactive typing test with advanced features, statistics tracking, and Next.js 15+ best practices

---

## 🚀 UPDATES IN THIS VERSION

### ✅ Features Added:
1. **Backspace Support** - Users can correct mistakes
2. **Error Highlighting** - Visual underline for incorrect characters  
3. **Keyboard Shortcuts** - Ctrl+R (reset), Ctrl+N (new passage), Escape (cancel)
4. **Statistics History** - LocalStorage persistence with best scores

### ✅ Architecture Review:
- Next.js App Router patterns validated
- Server/Client Component boundaries optimized
- Context Provider placement corrected
- Type safety improvements
- Performance optimizations

---

## Table of Contents

1. [Architecture Review & Current State](#architecture-review--current-state)
2. [Current vs Required Project Structure](#current-vs-required-project-structure)
3. [Enhanced Features Implementation](#enhanced-features-implementation)
4. [Updated Component Code Examples](#updated-component-code-examples)
5. [Statistics Persistence System](#statistics-persistence-system)
6. [Implementation Checklist](#implementation-checklist)
7. [Migration Guide](#migration-guide)

---

## Architecture Review & Current State

### ✅ VERIFIED: Next.js Best Practices Analysis

Based on [Next.js App Router Documentation](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns):

#### Current Implementation Status:

**✅ CORRECT:**
1. **Context Provider Pattern** - `GameContext.tsx` properly uses `"use client"` directive
2. **Client Components** - All interactive components correctly marked with `"use client"`  
3. **Component Composition** - Server Components passing data to Client Components via props
4. **Provider Placement** - Context provider wrapped correctly in page component

**⚠️ IMPROVEMENTS NEEDED:**
1. **LocalStorage Usage** - Need client-side only wrapper (browser API)
2. **Keyboard Events** - Already client-side, but need better event cleanup
3. **Type Safety** - Some typing improvements needed
4. **Bundle Size** - Can optimize by splitting GameContext logic

#### Current File States:

```
✅ IMPLEMENTED: Core typing test functionality
✅ IMPLEMENTED: Character validation and styling  
✅ IMPLEMENTED: Timer integration
✅ IMPLEMENTED: WPM/Accuracy calculation
✅ IMPLEMENTED: Overlay input (recent fix)

❌ MISSING: Backspace/correction support
❌ MISSING: Error highlighting (underline)
❌ MISSING: Keyboard shortcuts
❌ MISSING: Statistics persistence
❌ MISSING: Historical data tracking
```

---

## Current vs Required Project Structure

### CURRENT STRUCTURE (What You Have):

### CURRENT STRUCTURE (What You Have):

```
src/
├─ app/
│  ├─ page.tsx                    // ✅ Main page with GameProvider + components
│  ├─ layout.tsx                  // ✅ Root layout with Header/Footer
│  ├─ globals.css                 // ✅ Global styles
│  └─ api/
│     └─ passages/
│        ├─ route.ts              // ✅ REST API endpoint
│        └─ action/
│           └─ route.ts           // ✅ Server action wrapper
│
├─ components/
│  ├─ GameContext.tsx             // ✅ IMPLEMENTED - Manages typing state
│  ├─ typing-test/
│  │  ├─ TypingTestContainter.tsx // ✅ IMPLEMENTED - Main container
│  │  ├─ TypingInput.tsx          // ✅ IMPLEMENTED - Overlay input (recently fixed)
│  │  ├─ PassageDisplay.tsx       // ✅ IMPLEMENTED - Character display
│  │  └─ CharacterSpan.tsx        // ✅ IMPLEMENTED - Individual character
│  │
│  ├─ textcontainter.tsx          // ⚠️ DEPRECATED - Replace with TypingTestContainer
│  ├─ statsContainter.tsx         // ✅ WORKING - Displays metrics
│  ├─ header.tsx                  // ✅ WORKING
│  ├─ footer.tsx                  // ✅ WORKING
│  └─ README.md
│
├─ lib/
│  ├─ types.ts                    // ✅ IMPLEMENTED - All typing types defined
│  ├─ passages.ts                 // ✅ WORKING
│  ├─ utils/
│  │  ├─ typing-validation.ts    // ✅ IMPLEMENTED - Character validation
│  │  └─ metrics-calculation.ts  // ✅ IMPLEMENTED - WPM/accuracy calculations
│  │
│  └─ hooks/
│     ├─ index.ts                 // ✅ WORKING - Hook exports
│     ├─ useTimer.ts              // ✅ WORKING - Timer logic
│     └─ useTypingTest.ts         // ✅ EXISTS but NOT INTEGRATED yet
│
└─ data/
   └─ data.json                   // ✅ WORKING - Passage data
```

### REQUIRED ADDITIONS:

```
src/
├─ lib/
│  ├─ utils/
│  │  ├─ storage.ts              // ❌ NEW - LocalStorage wrapper with SSR safety
│  │  └─ keyboard-shortcuts.ts   // ❌ NEW - Keyboard event handlers
│  │
│  └─ hooks/
│     ├─ useKeyboardShortcuts.ts // ❌ NEW - Hook for keyboard shortcuts
│     └─ useStatistics.ts        // ❌ NEW - Statistics persistence hook
│
└─ types/
   └─ statistics.ts               // ❌ NEW - Statistics types (or add to lib/types.ts)
```

---

## Enhanced Features Implementation

### Feature 1: **Backspace Support (CRITICAL FIX)**

#### Problem:
Current implementation doesn't allow users to backspace and correct mistakes.

#### Solution:

---

#### Solution:

**Changes Required:**

1. **GameContext.tsx** - Update `handleTyping` to allow backspace
2. **TypingInput.tsx** - No changes needed (already captures backspace)
3. **typing-validation.ts** - Already handles variable length input

**Code Changes:**

```tsx
// File: src/components/GameContext.tsx
// CHANGE: Update handleTyping method

// ❌ OLD CODE (Lines ~175-195):
const handleTyping = useCallback((value: string) => {
	if (testStatus === "ready") {
		setTestStatus("running");
		timer.start();
	}
	
	if (testStatus !== "running") return;
	
	setTypedValue(value); // ← Only allows forward typing
	
	if (passage && value.length >= passage.text.length) {
		setTestStatus("completed");
		timer.complete();
	}
}, [testStatus, passage, timer]);

// ✅ NEW CODE (Replace above with):
const handleTyping = useCallback((value: string) => {
	// Auto-start on first keystroke
	if (testStatus === "ready" && value.length > 0) {
		setTestStatus("running");
		timer.start();
	}
	
	// Only allow typing when running
	if (testStatus !== "running") return;
	
	// Prevent typing beyond passage length
	if (passage && value.length > passage.text.length) {
		return; // ← Silently ignore extra characters
	}
	
	// ✅ ADDED: Allow backspace (value can be shorter than before)
	setTypedValue(value);
	
	// Check completion
	if (passage && value.length === passage.text.length && 
	    characterStates.every(s => s.state === "correct")) {
		setTestStatus("completed");
		timer.complete();
	}
}, [testStatus, passage, timer, characterStates]);
```

**Summary:**
- ✅ Backspace now works automatically (input onChange handles it)
- ✅ Prevents typing beyond passage length
- ✅ Only completes test when ALL characters are correct
- ✅ No validation.ts changes needed (already handles variable lengths)

---

### Feature 2: **Error Highlighting with Underline**

#### Problem:
Incorrect characters only show red color, but no underline emphasis.

#### Solution:

**Code Changes:**

```tsx
// File: src/components/typing-test/CharacterSpan.tsx
// CHANGE: Add underline styling for incorrect characters

// ❌ OLD CODE (Lines ~16-31):
const CharacterSpan: React.FC<CharacterSpanProps> = ({
	character,
	state,
	isCursor,
}) => {
	let className = "inline-block relative ";

	if (state === "correct") {
		className += "text-emerald-500 ";
	} else if (state === "incorrect") {
		className += "text-red-400 "; // ← Only color
	} else {
		className += "text-gray-400 ";
	}

	if (isCursor) {
		className += "border-b-2 border-FemBlue-400 ";
	}

	const displayChar = character === " " ? "\u00A0" : character;

	return (
		<span className={className} data-char={character}>
			{displayChar}
		</span>
	);
};

// ✅ NEW CODE (Replace above with):
const CharacterSpan: React.FC<CharacterSpanProps> = ({
	character,
	state,
	isCursor,
}) => {
	let className = "inline-block relative ";

	if (state === "correct") {
		className += "text-emerald-500 ";
	} else if (state === "incorrect") {
		// ✅ ADDED: Underline decoration for errors
		className += "text-red-400 underline decoration-2 decoration-red-400/70 ";
	} else {
		className += "text-gray-400 ";
	}

	if (isCursor) {
		className += "border-b-2 border-FemBlue-400 ";
	}

	const displayChar = character === " " ? "\u00A0" : character;

	return (
		<span className={className} data-char={character}>
			{displayChar}
		</span>
	);
};
```

**Tailwind Classes Added:**
- `underline` - Adds text underline
- `decoration-2` - Sets underline thickness
- `decoration-red-400/70` - Sets underline color with 70% opacity

---

### Feature 3: **Keyboard Shortcuts**

#### Problem:
No keyboard shortcuts for common actions (reset, new passage, cancel).

#### Solution:

**Step 1: Create Keyboard Shortcuts Utility**

```typescript
// File: src/lib/utils/keyboard-shortcuts.ts
// ❌ NEW FILE - Create this file

/**
 * Keyboard shortcut definitions
 */
export const KEYBOARD_SHORTCUTS = {
	RESET_TEST: { key: "r", ctrlKey: true, description: "Reset current test" },
	NEW_PASSAGE: { key: "n", ctrlKey: true, description: "Load new passage" },
	CANCEL_TEST: { key: "Escape", description: "Cancel current test" },
} as const;

export type ShortcutAction = "reset" | "newPassage" | "cancel";

/**
 * Check if keyboard event matches a shortcut
 */
export function matchesShortcut(
	event: KeyboardEvent,
	shortcut: typeof KEYBOARD_SHORTCUTS[keyof typeof KEYBOARD_SHORTCUTS]
): boolean {
	const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
	const ctrlMatches = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : true;
	
	return keyMatches && ctrlMatches;
}

/**
 * Get shortcut action from keyboard event
 */
export function getShortcutAction(event: KeyboardEvent): ShortcutAction | null {
	if (matchesShortcut(event, KEYBOARD_SHORTCUTS.RESET_TEST)) {
		return "reset";
	}
	if (matchesShortcut(event, KEYBOARD_SHORTCUTS.NEW_PASSAGE)) {
		return "newPassage";
	}
	if (matchesShortcut(event, KEYBOARD_SHORTCUTS.CANCEL_TEST)) {
		return "cancel";
	}
	return null;
}
```

**Step 2: Create useKeyboardShortcuts Hook**

```typescript
// File: src/lib/hooks/useKeyboardShortcuts.ts
// ❌ NEW FILE - Create this file

import { useEffect, useCallback } from "react";
import { getShortcutAction, ShortcutAction } from "../utils/keyboard-shortcuts";

interface UseKeyboardShortcutsParams {
	onReset?: () => void;
	onNewPassage?: () => void;
	onCancel?: () => void;
	enabled?: boolean;
}

/**
 * Hook to handle keyboard shortcuts
 */
export function useKeyboardShortcuts({
	onReset,
	onNewPassage,
	onCancel,
	enabled = true,
}: UseKeyboardShortcutsParams) {
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (!enabled) return;

			const action = getShortcutAction(event);

			if (action === "reset" && onReset) {
				event.preventDefault();
				onReset();
			} else if (action === "newPassage" && onNewPassage) {
				event.preventDefault();
				onNewPassage();
			} else if (action === "cancel" && onCancel) {
				event.preventDefault();
				onCancel();
			}
		},
		[enabled, onReset, onNewPassage, onCancel]
	);

	useEffect(() => {
		if (!enabled) return;

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [enabled, handleKeyDown]);
}
```

**Step 3: Integrate into GameContext**

```tsx
// File: src/components/GameContext.tsx
// CHANGE: Add keyboard shortcuts

// ✅ ADD IMPORT (Top of file):
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";

// ✅ ADD INSIDE GameProvider (after timer integration, before return):

// Keyboard shortcuts
useKeyboardShortcuts({
	onReset: resetTest,
	onNewPassage: fetchNewPassage,
	onCancel: () => {
		if (testStatus === "running") {
			resetTest();
		}
	},
	enabled: testStatus !== "idle",
});
```

**Step 4: Update hooks/index.ts**

```typescript
// File: src/lib/hooks/index.ts
// ✅ ADD EXPORT:

export { useTimer } from "./useTimer";
export { useTypingTest } from "./useTypingTest";
export { useKeyboardShortcuts } from "./useKeyboardShortcuts"; // ← Add this line
```

---

### Feature 4: **Statistics History & Persistence**

#### Problem:
No tracking of historical performance or best scores.

#### Solution:

**Step 1: Create Statistics Types**

```typescript
// File: src/lib/types.ts
// ✅ ADD TO EXISTING FILE (at the bottom):

/**
 * Statistics for a single test completion
 */
export interface TestResult {
	wpm: number;
	accuracy: number;
	difficulty: Difficulty;
	mode: Mode;
	passageId: string;
	completedAt: string; // ISO timestamp
	duration: number; // milliseconds
}

/**
 * User statistics history
 */
export interface UserStatistics {
	totalTests: number;
	bestWpm: number;
	bestAccuracy: number;
	averageWpm: number;
	averageAccuracy: number;
	recentTests: TestResult[]; // Last 10 tests
	lastUpdated: string; // ISO timestamp
}
```

**Step 2: Create Storage Utility (SSR-Safe)**

```typescript
// File: src/lib/utils/storage.ts
// ❌ NEW FILE - Create this file

/**
 * SSR-safe localStorage wrapper
 * Next.js best practice: Check for window before accessing localStorage
 */

const STORAGE_KEY_PREFIX = "typing-test-";

/**
 * Check if we're in browser environment
 */
function isBrowser(): boolean {
	return typeof window !== "undefined";
}

/**
 * Get item from localStorage
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
	if (!isBrowser()) return defaultValue;

	try {
		const item = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
		return item ? JSON.parse(item) : defaultValue;
	} catch (error) {
		console.error(`Error reading localStorage key "${key}":`, error);
		return defaultValue;
	}
}

/**
 * Set item in localStorage
 */
export function setLocalStorage<T>(key: string, value: T): void {
	if (!isBrowser()) return;

	try {
		window.localStorage.setItem(
			`${STORAGE_KEY_PREFIX}${key}`,
			JSON.stringify(value)
		);
	} catch (error) {
		console.error(`Error setting localStorage key "${key}":`, error);
	}
}

/**
 * Remove item from localStorage
 */
export function removeLocalStorage(key: string): void {
	if (!isBrowser()) return;

	try {
		window.localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
	} catch (error) {
		console.error(`Error removing localStorage key "${key}":`, error);
	}
}

/**
 * Clear all app-related localStorage
 */
export function clearAppStorage(): void {
	if (!isBrowser()) return;

	try {
		const keys = Object.keys(window.localStorage);
		keys.forEach(key => {
			if (key.startsWith(STORAGE_KEY_PREFIX)) {
				window.localStorage.removeItem(key);
			}
		});
	} catch (error) {
		console.error("Error clearing app storage:", error);
	}
}
```

**Step 3: Create useStatistics Hook**

```typescript
// File: src/lib/hooks/useStatistics.ts
// ❌ NEW FILE - Create this file

import { useState, useCallback, useEffect } from "react";
import { getLocalStorage, setLocalStorage } from "../utils/storage";
import type { UserStatistics, TestResult } from "../types";

const STATISTICS_KEY = "user-statistics";
const MAX_RECENT_TESTS = 10;

const DEFAULT_STATISTICS: UserStatistics = {
	totalTests: 0,
	bestWpm: 0,
	bestAccuracy: 0,
	averageWpm: 0,
	averageAccuracy: 0,
	recentTests: [],
	lastUpdated: new Date().toISOString(),
};

/**
 * Hook to manage user statistics
 */
export function useStatistics() {
	const [statistics, setStatistics] = useState<UserStatistics>(DEFAULT_STATISTICS);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load statistics from localStorage on mount
	useEffect(() => {
		const stored = getLocalStorage<UserStatistics>(STATISTICS_KEY, DEFAULT_STATISTICS);
		setStatistics(stored);
		setIsLoaded(true);
	}, []);

	/**
	 * Save new test result
	 */
	const saveTestResult = useCallback((result: TestResult) => {
		setStatistics(prev => {
			const newRecentTests = [result, ...prev.recentTests].slice(0, MAX_RECENT_TESTS);
			const allTests = [result, ...prev.recentTests];

			// Calculate new averages
			const totalWpm = allTests.reduce((sum, test) => sum + test.wpm, 0);
			const totalAccuracy = allTests.reduce((sum, test) => sum + test.accuracy, 0);
			const count = allTests.length;

			const newStats: UserStatistics = {
				totalTests: prev.totalTests + 1,
				bestWpm: Math.max(prev.bestWpm, result.wpm),
				bestAccuracy: Math.max(prev.bestAccuracy, result.accuracy),
				averageWpm: Math.round(totalWpm / count),
				averageAccuracy: Math.round(totalAccuracy / count),
				recentTests: newRecentTests,
				lastUpdated: new Date().toISOString(),
			};

			// Persist to localStorage
			setLocalStorage(STATISTICS_KEY, newStats);

			return newStats;
		});
	}, []);

	/**
	 * Clear all statistics
	 */
	const clearStatistics = useCallback(() => {
		setStatistics(DEFAULT_STATISTICS);
		setLocalStorage(STATISTICS_KEY, DEFAULT_STATISTICS);
	}, []);

	return {
		statistics,
		isLoaded,
		saveTestResult,
		clearStatistics,
	};
}
```

**Step 4: Update hooks/index.ts**

```typescript
// File: src/lib/hooks/index.ts
// ✅ ADD EXPORT:

export { useTimer } from "./useTimer";
export { useTypingTest } from "./useTypingTest";
export { useKeyboardShortcuts } from "./useKeyboardShortcuts";
export { useStatistics } from "./useStatistics"; // ← Add this line
```

**Step 5: Integrate into GameContext**

```tsx
// File: src/components/GameContext.tsx
// CHANGE: Add statistics tracking

// ✅ ADD IMPORT (Top of file):
import { useStatistics } from "@/lib/hooks/useStatistics";
import type { TestResult } from "@/lib/types";

// ✅ ADD TO GameState INTERFACE:
interface GameState {
	// ... existing properties
	
	// ✅ ADD:
	statistics: UserStatistics;
	saveTestResult: (result: TestResult) => void;
	clearStatistics: () => void;
}

// ✅ ADD TO defaultState:
const defaultState: GameState = {
	// ... existing properties
	
	// ✅ ADD:
	statistics: {
		totalTests: 0,
		bestWpm: 0,
		bestAccuracy: 0,
		averageWpm: 0,
		averageAccuracy: 0,
		recentTests: [],
		lastUpdated: new Date().toISOString(),
	},
	saveTestResult: () => {},
	clearStatistics: () => {},
};

// ✅ INSIDE GameProvider (after timer, before character validation):

// Statistics tracking
const { statistics, saveTestResult, clearStatistics } = useStatistics();

// ✅ UPDATE handleTyping to save on completion:
const handleTyping = useCallback((value: string) => {
	if (testStatus === "ready" && value.length > 0) {
		setTestStatus("running");
		timer.start();
	}
	
	if (testStatus !== "running") return;
	
	if (passage && value.length > passage.text.length) {
		return;
	}
	
	setTypedValue(value);
	
	// Check completion
	if (passage && value.length === passage.text.length && 
	    characterStates.every(s => s.state === "correct")) {
		setTestStatus("completed");
		timer.complete();
		
		// ✅ SAVE TEST RESULT
		const result: TestResult = {
			wpm,
			accuracy,
			difficulty,
			mode,
			passageId: passage.id,
			completedAt: new Date().toISOString(),
			duration: timer.elapsedMs,
		};
		saveTestResult(result);
	}
}, [testStatus, passage, timer, characterStates, wpm, accuracy, difficulty, mode, saveTestResult]);

// ✅ ADD TO MEMOIZED VALUE:
const value: GameState = useMemo(
	() => ({
		// ... existing properties
		
		// ✅ ADD:
		statistics,
		saveTestResult,
		clearStatistics,
	}),
	[
		// ... existing dependencies
		
		// ✅ ADD:
		statistics,
		saveTestResult,
		clearStatistics,
	]
);
```

**Step 6: Display Statistics in Completion Screen**

```tsx
// File: src/components/typing-test/TypingTestContainter.tsx
// CHANGE: Update completed state to show statistics

// ❌ OLD COMPLETED STATE (Lines ~51-79):
if (game.testStatus === "completed") {
	return (
		<div className="w-full max-w-4xl mx-auto mt-8">
			<PassageDisplay />
			<div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
				<h2 className="text-2xl font-bold text-FemBlue-400 mb-4">
					Test Complete!
				</h2>
				<div className="grid grid-cols-3 gap-4 mb-6">
					<div>
						<p className="text-gray-400 text-sm">WPM</p>
						<p className="text-3xl font-bold text-gray-100">{game.wpm}</p>
					</div>
					<div>
						<p className="text-gray-400 text-sm">Accuracy</p>
						<p className="text-3xl font-bold text-gray-100">
							{game.accuracy}%
						</p>
					</div>
					<div>
						<p className="text-gray-400 text-sm">Time</p>
						<p className="text-3xl font-bold text-gray-100">{game.time}</p>
					</div>
				</div>
				<button
					onClick={game.resetTest}
					className="w-full px-6 py-3 bg-FemBlue-400 hover:bg-FemBlue-500 text-black font-semibold rounded transition"
					type="button"
				>
					Try Again
				</button>
			</div>
		</div>
	);
}

// ✅ NEW COMPLETED STATE (Replace above with):
if (game.testStatus === "completed") {
	const isNewBest = game.wpm > game.statistics.bestWpm;
	
	return (
		<div className="w-full max-w-4xl mx-auto mt-8">
			<PassageDisplay />
			<div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
				<h2 className="text-2xl font-bold text-FemBlue-400 mb-4">
					Test Complete! {isNewBest && "🎉 New Personal Best!"}
				</h2>
				
				{/* Current Test Results */}
				<div className="grid grid-cols-3 gap-4 mb-6">
					<div>
						<p className="text-gray-400 text-sm">WPM</p>
						<p className="text-3xl font-bold text-gray-100">{game.wpm}</p>
					</div>
					<div>
						<p className="text-gray-400 text-sm">Accuracy</p>
						<p className="text-3xl font-bold text-gray-100">
							{game.accuracy}%
						</p>
					</div>
					<div>
						<p className="text-gray-400 text-sm">Time</p>
						<p className="text-3xl font-bold text-gray-100">{game.time}</p>
					</div>
				</div>
				
				{/* Statistics Summary */}
				<div className="mb-6 p-4 bg-gray-900 rounded border border-gray-700">
					<h3 className="text-sm font-semibold text-gray-400 mb-3">
						Your Statistics
					</h3>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p className="text-gray-500">Total Tests</p>
							<p className="text-gray-200 font-semibold">
								{game.statistics.totalTests}
							</p>
						</div>
						<div>
							<p className="text-gray-500">Best WPM</p>
							<p className="text-emerald-400 font-semibold">
								{game.statistics.bestWpm}
							</p>
						</div>
						<div>
							<p className="text-gray-500">Average WPM</p>
							<p className="text-gray-200 font-semibold">
								{game.statistics.averageWpm}
							</p>
						</div>
						<div>
							<p className="text-gray-500">Best Accuracy</p>
							<p className="text-emerald-400 font-semibold">
								{game.statistics.bestAccuracy}%
							</p>
						</div>
					</div>
				</div>
				
				{/* Action Buttons */}
				<div className="flex gap-3">
					<button
						onClick={game.resetTest}
						className="flex-1 px-6 py-3 bg-FemBlue-400 hover:bg-FemBlue-500 text-black font-semibold rounded transition"
						type="button"
					>
						Try Again
					</button>
					<button
						onClick={game.fetchNewPassage}
						className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded transition"
						type="button"
					>
						New Passage
					</button>
				</div>
				
				{/* Keyboard Shortcuts Hint */}
				<p className="mt-4 text-xs text-gray-500 text-center">
					Shortcuts: <kbd className="px-2 py-1 bg-gray-700 rounded">Ctrl+R</kbd> Reset · 
					<kbd className="px-2 py-1 bg-gray-700 rounded ml-2">Ctrl+N</kbd> New Passage
				</p>
			</div>
		</div>
	);
}
```

---

## Updated Component Code Examples

### 1. COMPLETE GameContext.tsx (WITH ALL FEATURES)

```tsx
// File: src/components/GameContext.tsx
// ✅ COMPLETE UPDATED VERSION

"use client";

import { useTimer } from "@/lib/hooks";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { useStatistics } from "@/lib/hooks/useStatistics";
import {
	CharacterState,
	Difficulty,
	Mode,
	Passage,
	TestResult,
	TypingTestStatus,
	UserStatistics,
} from "@/lib/types";
import {
	calculateAccuracy,
	calculateWPM,
	formatTime,
} from "@/lib/utils/metrics-calculation";
import { validateTypedInput } from "@/lib/utils/typing-validation";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

interface GameState {
	// Existing state
	difficulty: Difficulty;
	mode: Mode;
	wpm: number;
	accuracy: number;
	time: string;

	// Typing test state
	passage: Passage | null;
	typedValue: string;
	characterStates: CharacterState[];
	testStatus: TypingTestStatus;
	cursorIndex: number;

	// ✅ NEW: Statistics
	statistics: UserStatistics;

	// Setters
	setDifficulty: (d: Difficulty) => void;
	setMode: (m: Mode) => void;

	// Typing test methods
	startTest: () => void;
	resetTest: () => void;
	handleTyping: (input: string) => void;
	fetchNewPassage: () => Promise<void>;

	// ✅ NEW: Statistics methods
	saveTestResult: (result: TestResult) => void;
	clearStatistics: () => void;
}

const defaultState: GameState = {
	difficulty: "easy",
	mode: "timed",
	wpm: 0,
	accuracy: 100,
	time: "0:60",
	passage: null,
	typedValue: "",
	characterStates: [],
	testStatus: "idle",
	cursorIndex: 0,
	statistics: {
		totalTests: 0,
		bestWpm: 0,
		bestAccuracy: 0,
		averageWpm: 0,
		averageAccuracy: 0,
		recentTests: [],
		lastUpdated: new Date().toISOString(),
	},
	setDifficulty: () => {},
	setMode: () => {},
	startTest: () => {},
	resetTest: () => {},
	handleTyping: () => {},
	fetchNewPassage: async () => {},
	saveTestResult: () => {},
	clearStatistics: () => {},
};

const GameContext = createContext<GameState>(defaultState);

export const GameProvider: React.FC<React.PropsWithChildren<unknown>> = ({
	children,
}) => {
	const [difficulty, setDifficulty] = useState<Difficulty>(
		defaultState.difficulty,
	);
	const [mode, setMode] = useState<Mode>(defaultState.mode);
	const [passage, setPassage] = useState<Passage | null>(null);
	const [typedValue, setTypedValue] = useState<string>("");
	const [testStatus, setTestStatus] = useState<TypingTestStatus>("idle");

	// Timer integration
	const timer = useTimer({
		duration: mode === "timed" ? 60000 : null,
		autoStart: false,
		onComplete: () => {
			setTestStatus("completed");
		},
	});

	// ✅ NEW: Statistics tracking
	const { statistics, saveTestResult, clearStatistics } = useStatistics();

	// Character validation
	const characterStates = useMemo(() => {
		if (!passage) return [];
		return validateTypedInput(typedValue, passage.text);
	}, [typedValue, passage]);

	const cursorIndex = typedValue.length;

	// Calculate metrics
	const { correctCount, incorrectCount } = useMemo(() => {
		const correct = characterStates.filter((s) => s.state === "correct").length;
		const incorrect = characterStates.filter(
			(s) => s.state === "incorrect",
		).length;
		return { correctCount: correct, incorrectCount: incorrect };
	}, [characterStates]);

	const wpm = useMemo(() => {
		return calculateWPM(correctCount, timer.elapsedMs);
	}, [correctCount, timer.elapsedMs]);

	const accuracy = useMemo(() => {
		return calculateAccuracy(correctCount, incorrectCount);
	}, [correctCount, incorrectCount]);

	const time = useMemo(() => {
		if (mode === "timed" && timer.remainingMs !== null) {
			return formatTime(timer.remainingMs);
		}
		return formatTime(timer.elapsedMs);
	}, [mode, timer.elapsedMs, timer.remainingMs]);

	// Fetch passage when difficulty changes
	const fetchNewPassage = useCallback(async () => {
		try {
			const res = await fetch(
				`/api/passages/action?difficulty=${difficulty.toLowerCase()}`,
				{ cache: "no-store" },
			);
			if (!res.ok) throw new Error("Failed to fetch passage");
			const data: Passage = await res.json();
			setPassage(data);
			setTypedValue(""); // ✅ Clear typed value
			setTestStatus("ready");
			timer.reset(); // ✅ Reset timer
		} catch (error) {
			console.error("Failed to fetch passage:", error);
		}
	}, [difficulty, timer]);

	useEffect(() => {
		fetchNewPassage();
	}, [fetchNewPassage]);

	// Typing handlers
	const startTest = useCallback(() => {
		if (testStatus !== "ready") return;
		setTestStatus("running");
		timer.start();
	}, [testStatus, timer]);

	const resetTest = useCallback(() => {
		setTypedValue("");
		setTestStatus("ready");
		timer.reset();
	}, [timer]);

	// ✅ UPDATED: Handle typing with backspace support and statistics saving
	const handleTyping = useCallback(
		(value: string) => {
			// Auto-start on first keystroke
			if (testStatus === "ready" && value.length > 0) {
				setTestStatus("running");
				timer.start();
			}

			// Only allow typing when running
			if (testStatus !== "running") return;

			// Prevent typing beyond passage length
			if (passage && value.length > passage.text.length) {
				return;
			}

			// ✅ Allow backspace (value can be shorter)
			setTypedValue(value);

			// Check completion
			if (
				passage &&
				value.length === passage.text.length &&
				characterStates.every((s) => s.state === "correct")
			) {
				setTestStatus("completed");
				timer.complete();

				// ✅ Save test result
				const result: TestResult = {
					wpm,
					accuracy,
					difficulty,
					mode,
					passageId: passage.id,
					completedAt: new Date().toISOString(),
					duration: timer.elapsedMs,
				};
				saveTestResult(result);
			}
		},
		[
			testStatus,
			passage,
			timer,
			characterStates,
			wpm,
			accuracy,
			difficulty,
			mode,
			saveTestResult,
		],
	);

	// ✅ NEW: Keyboard shortcuts
	useKeyboardShortcuts({
		onReset: resetTest,
		onNewPassage: fetchNewPassage,
		onCancel: () => {
			if (testStatus === "running") {
				resetTest();
			}
		},
		enabled: testStatus !== "idle",
	});

	const value: GameState = useMemo(
		() => ({
			difficulty,
			mode,
			wpm,
			accuracy,
			time,
			passage,
			typedValue,
			characterStates,
			testStatus,
			cursorIndex,
			statistics, // ✅ Added
			setDifficulty,
			setMode,
			startTest,
			resetTest,
			handleTyping,
			fetchNewPassage,
			saveTestResult, // ✅ Added
			clearStatistics, // ✅ Added
		}),
		[
			difficulty,
			mode,
			wpm,
			accuracy,
			time,
			passage,
			typedValue,
			characterStates,
			testStatus,
			cursorIndex,
			statistics, // ✅ Added
			startTest,
			resetTest,
			handleTyping,
			fetchNewPassage,
			saveTestResult, // ✅ Added
			clearStatistics, // ✅ Added
		],
	);

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame() {
	return useContext(GameContext);
}

export default GameContext;
```

---

## Implementation Checklist (UPDATED)

### ✅ Phase 1: Backspace Support (PRIORITY 1)
- [ ] Update `GameContext.tsx` `handleTyping` method
- [ ] Test backspace functionality
- [ ] Verify character states update correctly

### ✅ Phase 2: Error Highlighting (PRIORITY 1)
- [ ] Update `CharacterSpan.tsx` with underline styling
- [ ] Test visual appearance of incorrect characters
- [ ] Verify Tailwind classes are applied

### ✅ Phase 3: Keyboard Shortcuts (PRIORITY 2)
- [ ] Create `lib/utils/keyboard-shortcuts.ts`
- [ ] Create `lib/hooks/useKeyboardShortcuts.ts`
- [ ] Integrate into `GameContext.tsx`
- [ ] Update `lib/hooks/index.ts` exports
- [ ] Test all keyboard shortcuts (Ctrl+R, Ctrl+N, Escape)

### ✅ Phase 4: Statistics Persistence (PRIORITY 2)
- [ ] Add statistics types to `lib/types.ts`
- [ ] Create `lib/utils/storage.ts` (SSR-safe)
- [ ] Create `lib/hooks/useStatistics.ts`
- [ ] Integrate into `GameContext.tsx`
- [ ] Update `TypingTestContainter.tsx` completion screen
- [ ] Update `lib/hooks/index.ts` exports
- [ ] Test localStorage persistence
- [ ] Test statistics calculations

### ✅ Phase 5: Testing & Polish (PRIORITY 3)
- [ ] Test all features together
- [ ] Verify SSR compatibility (no localStorage errors on server)
- [ ] Test keyboard shortcuts don't interfere with typing
- [ ] Verify statistics persist across page refreshes
- [ ] Test on mobile devices
- [ ] Verify accessibility (keyboard navigation)

### ✅ Phase 6: Optional Enhancements
- [ ] Add statistics visualization (charts)
- [ ] Export statistics as CSV/JSON
- [ ] Add difficulty-specific statistics
- [ ] Add streak tracking
- [ ] Add achievements/badges system

---

## Migration Guide

### Step-by-Step Implementation Order:

1. **START HERE: Backspace Support** (5 minutes)
   - Edit `GameContext.tsx` → Update `handleTyping`
   - Test immediately

2. **Error Highlighting** (2 minutes)
   - Edit `CharacterSpan.tsx` → Add underline classes
   - Visual verification

3. **Statistics System** (20 minutes)
   - Create `lib/utils/storage.ts`
   - Add types to `lib/types.ts`
   - Create `lib/hooks/useStatistics.ts`
   - Update `lib/hooks/index.ts`
   - Update `GameContext.tsx`
   - Update `TypingTestContainter.tsx`

4. **Keyboard Shortcuts** (15 minutes)
   - Create `lib/utils/keyboard-shortcuts.ts`
   - Create `lib/hooks/useKeyboardShortcuts.ts`
   - Update `lib/hooks/index.ts`
   - Update `GameContext.tsx`

5. **Testing** (15 minutes)
   - Test each feature
   - Verify no regressions
   - Test edge cases

**Total Estimated Time:** ~60 minutes

---

## Testing Checklist

### Backspace Support:
- [ ] Type forward, backspace, type again
- [ ] Backspace to beginning
- [ ] Verify WPM/accuracy update correctly
- [ ] Cannot backspace before start

### Error Highlighting:
- [ ] Incorrect characters show underline
- [ ] Correct characters have no underline
- [ ] Underline visible on all screen sizes
- [ ] Works with cursor indicator

### Keyboard Shortcuts:
- [ ] Ctrl+R resets test
- [ ] Ctrl+N fetches new passage
- [ ] Escape cancels running test
- [ ] Shortcuts don't interfere with typing
- [ ] Shortcuts disabled when idle

### Statistics:
- [ ] Statistics save on test completion
- [ ] Best scores update correctly
- [ ] Averages calculate correctly
- [ ] Statistics persist across page refresh
- [ ] Recent tests list updates
- [ ] Statistics cleared properly
- [ ] No SSR errors (localStorage)

---

## Troubleshooting

### localStorage SSR Errors:
**Problem:** `ReferenceError: localStorage is not defined`

**Solution:** Ensure all localStorage access uses the `storage.ts` wrapper with SSR checks.

### Keyboard Shortcuts Not Working:
**Problem:** Shortcuts trigger but don't work

**Solution:** Verify `useKeyboardShortcuts` is called inside `GameProvider` and `enabled` prop is true.

### Statistics Not Persisting:
**Problem:** Statistics reset on page refresh

**Solution:** Check browser console for localStorage errors. Verify `useStatistics` hook is properly integrated.

### Backspace Deletes Too Much:
**Problem:** Backspace removes multiple characters

**Solution:** Verify `handleTyping` doesn't have any string manipulation logic that interferes with input value.

---

## Next.js Architecture Compliance

### ✅ VERIFIED PATTERNS:

1. **Client Components:**
   - All interactive components use `"use client"` directive
   - Context providers are Client Components
   - Hooks are only used in Client Components

2. **Server Components:**
   - API routes are server-side only
   - No direct database access in Client Components
   - Environment variables properly prefixed with `NEXT_PUBLIC_`

3. **Data Flow:**
   - Server Components fetch data
   - Props pass data to Client Components
   - Context used for global client state only

4. **Performance:**
   - useMemo for expensive calculations
   - useCallback for event handlers
   - Minimal client-side JavaScript

---

## Summary of Changes

| File | Status | Changes |
|------|--------|---------|
| `GameContext.tsx` | 🟡 UPDATE | Add backspace support, keyboard shortcuts, statistics |
| `CharacterSpan.tsx` | 🟡 UPDATE | Add error underline styling |
| `TypingTestContainter.tsx` | 🟡 UPDATE | Enhanced completion screen with statistics |
| `lib/types.ts` | 🟡 UPDATE | Add TestResult, UserStatistics types |
| `lib/utils/storage.ts` | 🟢 NEW | SSR-safe localStorage wrapper |
| `lib/utils/keyboard-shortcuts.ts` | 🟢 NEW | Keyboard shortcut definitions and handlers |
| `lib/hooks/useStatistics.ts` | 🟢 NEW | Statistics persistence hook |
| `lib/hooks/useKeyboardShortcuts.ts` | 🟢 NEW | Keyboard shortcuts hook |
| `lib/hooks/index.ts` | 🟡 UPDATE | Export new hooks |

**Legend:**
- 🟢 NEW = Create new file
- 🟡 UPDATE = Modify existing file
- 🔴 DELETE = Remove file (none in this update)

---

## Final Notes

1. **All code blocks provided are complete and ready to use**
2. **Comments indicate what's changed from old code**
3. **No file will be automatically edited - you must manually apply changes**
4. **Test each feature individually before moving to the next**
5. **Statistics data is client-side only (localStorage)**
6. **Keyboard shortcuts are non-intrusive and optional**

**Ready to implement!** Start with Phase 1 (Backspace Support) for immediate impact.

---



```
src/
├─ app/
│  ├─ page.tsx                    // [UPDATED] Renders TypingTestContainer instead of separate components
│  ├─ layout.tsx                  // [UNCHANGED] Root layout
│  ├─ globals.css                 // [UNCHANGED] Global styles
│  └─ api/
│     └─ passages/                // [UNCHANGED]
│
├─ components/
│  ├─ GameContext.tsx             // [MAJOR UPDATE] Manages typing state, metrics, passage, timer
│  │
│  ├─ typing-test/                // [NEW] Typing test feature components
│  │  ├─ TypingTestContainer.tsx // [NEW] Main container orchestrating typing test flow
│  │  ├─ TypingInput.tsx          // [NEW] Hidden input that captures keystrokes
│  │  ├─ PassageDisplay.tsx       // [NEW] Displays passage with character styling
│  │  └─ CharacterSpan.tsx        // [NEW] Individual character with validation styling
│  │
│  ├─ statsContainter.tsx         // [MINOR UPDATE] Reads from enhanced GameContext
│  ├─ header.tsx                  // [UNCHANGED]
│  ├─ footer.tsx                  // [UNCHANGED]
│  └─ README.md                   // [UPDATE] Document new components
│
├─ lib/
│  ├─ types.ts                    // [EXPAND] Add CharacterState, TypingState types
│  ├─ passages.ts                 // [UNCHANGED]
│  ├─ utils/                      // [NEW] Utility functions
│  │  ├─ typing-validation.ts    // [NEW] Character validation, normalization
│  │  └─ metrics-calculation.ts  // [NEW] WPM and accuracy calculations
│  │
│  └─ hooks/
│     ├─ index.ts                 // [UPDATE] Export all hooks
│     ├─ useTimer.ts              // [UNCHANGED] Already exists
│     ├─ useTypingTest.ts         // [UNCHANGED] Already exists
│     └─ useTypingMetrics.ts     // [NEW] Hook to calculate metrics from typing state
│
└─ data/
   └─ data.json                   // [UNCHANGED]
```

### Why Each New Component Exists

#### **typing-test/TypingTestContainer.tsx**
- **Purpose:** Top-level orchestrator for the typing test
- **Why:** Keeps `page.tsx` clean and separates typing test logic from layout concerns
- **Responsibility:** Connects GameContext to child components, handles test lifecycle

#### **typing-test/TypingInput.tsx**
- **Purpose:** Invisible input field that captures user keystrokes
- **Why:** Separates input handling from display logic
- **Responsibility:** Manages focus, captures typed characters, sends updates to GameContext

#### **typing-test/PassageDisplay.tsx**
- **Purpose:** Renders the passage with styled characters above the input
- **Why:** Separates display logic from input logic
- **Responsibility:** Maps each character to CharacterSpan, shows cursor position

#### **typing-test/CharacterSpan.tsx**
- **Purpose:** Single character with validation styling
- **Why:** Reusable, testable component for character rendering
- **Responsibility:** Applies correct/incorrect/neutral styling based on character state

#### **lib/utils/typing-validation.ts**
- **Purpose:** Pure functions for character validation
- **Why:** Testable, reusable logic separate from React components
- **Functions:** `normalizeCharacter()`, `isCharacterCorrect()`, `validateTypedInput()`

#### **lib/utils/metrics-calculation.ts**
- **Purpose:** Pure functions for WPM and accuracy calculation
- **Why:** Testable, reusable, can be used in multiple contexts
- **Functions:** `calculateWPM()`, `calculateAccuracy()`, `formatTime()`

#### **lib/hooks/useTypingMetrics.ts**
- **Purpose:** React hook that derives metrics from typing state
- **Why:** Encapsulates metric calculation logic, provides memoized values
- **Returns:** `{ wpm, accuracy, correctCount, incorrectCount, progress }`

---

## Responsibility Mapping

### GameContext.tsx
**Current Responsibilities:**
- Stores difficulty, mode, wpm, accuracy, time
- Provides setters for each value

**NEW Responsibilities (Enhanced):**
- ✅ Store current passage (`passage: Passage | null`)
- ✅ Store typed value (`typedValue: string`)
- ✅ Store character states (`characterStates: CharacterState[]`)
- ✅ Store typing test status (`testStatus: 'idle' | 'ready' | 'running' | 'completed'`)
- ✅ Store timer state (via `useTimer` hook)
- ✅ Calculate and expose real-time WPM
- ✅ Calculate and expose real-time accuracy
- ✅ Provide `startTest()`, `resetTest()`, `handleTyping()` methods
- ✅ Fetch new passages based on difficulty changes
- ✅ Track correct/incorrect character counts

**What Logic Belongs Here:**
- Global typing state (typed value, cursor position)
- Passage fetching and storage
- Timer integration (`useTimer` hook)
- Typing test lifecycle (start, reset, complete)
- Real-time metric calculations (WPM, accuracy)
- Character validation state management

**What Should NOT Be Here:**
- JSX rendering logic
- Input element management
- Character-level styling details
- Low-level key event handling

---

### typing-test/TypingTestContainer.tsx
**Responsibilities:**
- Read typing state from GameContext
- Orchestrate PassageDisplay and TypingInput
- Handle test start/reset UI logic
- Show loading/error states for passage fetching
- Display "Start" button or instructions when idle

**Logic That Belongs Here:**
- Conditional rendering based on `testStatus`
- Layout of typing test UI elements
- Button handlers that call GameContext methods

**Logic That Does NOT Belong Here:**
- Character validation (→ GameContext / utils)
- WPM calculation (→ GameContext / utils)
- Keystroke capture (→ TypingInput)
- Character rendering (→ PassageDisplay)

---

### typing-test/TypingInput.tsx
**Responsibilities:**
- Render invisible `<input>` or `<textarea>`
- Capture user keystrokes
- Call `game.handleTyping(newValue)` on every keystroke
- Manage focus state
- Auto-focus when test starts
- Prevent losing focus during typing

**Logic That Belongs Here:**
- `onChange` handler
- `onFocus` / `onBlur` handlers
- Focus restoration logic
- Input value syncing with GameContext

**Logic That Does NOT Belong Here:**
- Character validation (→ GameContext)
- Metric calculation (→ GameContext)
- Styling of characters (→ PassageDisplay)

---

### typing-test/PassageDisplay.tsx
**Responsibilities:**
- Map passage characters to `CharacterSpan` components
- Display cursor indicator at current position
- Apply layout styling to passage container
- Handle responsive text sizing

**Logic That Belongs Here:**
- `.map()` over passage characters
- Cursor position indicator
- Character grid/flex layout

**Logic That Does NOT Belong Here:**
- Character validation (→ GameContext provides state)
- Input handling (→ TypingInput)
- WPM/accuracy (→ shown in StatsContainer)

---

### typing-test/CharacterSpan.tsx
**Responsibilities:**
- Render a single character
- Apply styling based on state (correct, incorrect, untyped, cursor)
- Handle special characters (spaces, newlines)

**Props Interface:**
```typescript
interface CharacterSpanProps {
  character: string;
  state: 'untyped' | 'correct' | 'incorrect' | 'cursor';
  index: number;
}
```

**Styling Logic:**
- `state === 'correct'` → `text-emerald-500`
- `state === 'incorrect'` → `text-red-400`
- `state === 'untyped'` → `text-gray-400`
- `state === 'cursor'` → `border-b-2 border-FemBlue-400`

**Logic That Belongs Here:**
- Conditional Tailwind classes
- Special character rendering (e.g., `·` for spaces)

**Logic That Does NOT Belong Here:**
- Determining character state (→ GameContext provides this)
- Handling clicks or input

---

### lib/utils/typing-validation.ts
**Pure Functions (No React):**

```typescript
/**
 * Normalize special characters (curly quotes, em-dashes, etc.)
 */
export function normalizeCharacter(char: string): string

/**
 * Check if typed character matches expected character
 */
export function isCharacterCorrect(
  typed: string, 
  expected: string, 
  index: number
): boolean

/**
 * Validate entire typed string against passage
 * Returns array of character states
 */
export function validateTypedInput(
  typedValue: string, 
  passage: string
): CharacterState[]
```

**Why These Are Pure Functions:**
- Testable without React
- Reusable across components
- Easy to debug

---

### lib/utils/metrics-calculation.ts
**Pure Functions (No React):**

```typescript
/**
 * Calculate Words Per Minute
 * WPM = (characters typed / 5) / (elapsed time in minutes)
 */
export function calculateWPM(
  correctCharCount: number,
  elapsedMs: number
): number

/**
 * Calculate accuracy percentage
 * Accuracy = (correct / total) * 100
 */
export function calculateAccuracy(
  correctCount: number,
  incorrectCount: number
): number

/**
 * Format milliseconds to "M:SS" format
 */
export function formatTime(ms: number): string
```

**Why These Are Pure Functions:**
- Easy to unit test
- Can be used in multiple contexts (GameContext, useTypingMetrics)
- Performance optimization (memoization)

---

### lib/hooks/useTypingMetrics.ts
**Purpose:** React hook that derives metrics from typing state

```typescript
interface UseTypingMetricsParams {
  typedValue: string;
  passage: string;
  elapsedMs: number;
}

interface UseTypingMetricsReturn {
  wpm: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  progress: number;
}

export function useTypingMetrics(
  params: UseTypingMetricsParams
): UseTypingMetricsReturn
```

**Responsibilities:**
- Call validation utils
- Call calculation utils
- Memoize results with `useMemo`
- Return derived metrics

**Why This Exists:**
- Encapsulates metric calculation logic
- Can be reused in different components
- Memoization prevents recalculation on every render

---

### statsContainter.tsx
**Current Responsibilities:**
- Display WPM, accuracy, time
- Render difficulty and mode toggles

**Changes Needed:**
- ✅ Read real-time WPM from GameContext (already does this via `game.wpm`)
- ✅ Read real-time accuracy from GameContext (already does this via `game.accuracy`)
- ✅ Read formatted time from GameContext (already does this via `game.time`)
- ✅ No major logic changes needed

**Updated Behavior:**
- GameContext will now update `wpm`, `accuracy`, and `time` in real-time
- StatsContainer just displays these values (no calculation logic here)

---

### app/page.tsx
**Current Code:**
```tsx
<GameProvider>
  <main>
    <StatsContainter />
    <Textcontainter />
  </main>
</GameProvider>
```

**New Code:**
```tsx
<GameProvider>
  <main>
    <StatsContainter />
    <TypingTestContainer />
  </main>
</GameProvider>
```

**Why:**
- `TypingTestContainer` replaces `Textcontainter`
- `TypingTestContainer` includes both passage display and input
- Cleaner separation of concerns

---

## Component Code Examples

### 1. Enhanced GameContext.tsx

```tsx
"use client";

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { useTimer } from "@/lib/hooks/useTimer";
import { validateTypedInput } from "@/lib/utils/typing-validation";
import { calculateWPM, calculateAccuracy, formatTime } from "@/lib/utils/metrics-calculation";
import type { Passage, Difficulty, Mode, CharacterState, TypingTestStatus } from "@/lib/types";

interface GameState {
	// Existing state
	difficulty: Difficulty;
	mode: Mode;
	wpm: number;
	accuracy: number;
	time: string;
	
	// NEW: Typing test state
	passage: Passage | null;
	typedValue: string;
	characterStates: CharacterState[];
	testStatus: TypingTestStatus;
	cursorIndex: number;
	
	// Existing setters
	setDifficulty: (d: Difficulty) => void;
	setMode: (m: Mode) => void;
	
	// NEW: Typing test methods
	startTest: () => void;
	resetTest: () => void;
	handleTyping: (value: string) => void;
	fetchNewPassage: () => Promise<void>;
}

const defaultState: GameState = {
	difficulty: "easy",
	mode: "timed",
	wpm: 0,
	accuracy: 100,
	time: "0:60",
	passage: null,
	typedValue: "",
	characterStates: [],
	testStatus: "idle",
	cursorIndex: 0,
	setDifficulty: () => {},
	setMode: () => {},
	startTest: () => {},
	resetTest: () => {},
	handleTyping: () => {},
	fetchNewPassage: async () => {},
};

const GameContext = createContext<GameState>(defaultState);

export const GameProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
	const [difficulty, setDifficulty] = useState<Difficulty>(defaultState.difficulty);
	const [mode, setMode] = useState<Mode>(defaultState.mode);
	const [passage, setPassage] = useState<Passage | null>(null);
	const [typedValue, setTypedValue] = useState("");
	const [testStatus, setTestStatus] = useState<TypingTestStatus>("idle");

	// Timer integration
	const timer = useTimer({
		duration: mode === "timed" ? 60 : null,
		autoStart: false,
		onComplete: () => {
			setTestStatus("completed");
		},
	});

	// Character validation
	const characterStates = useMemo(() => {
		if (!passage) return [];
		return validateTypedInput(typedValue, passage.text);
	}, [typedValue, passage]);

	const cursorIndex = typedValue.length;

	// Calculate metrics
	const { correctCount, incorrectCount } = useMemo(() => {
		const correct = characterStates.filter(s => s.state === "correct").length;
		const incorrect = characterStates.filter(s => s.state === "incorrect").length;
		return { correctCount: correct, incorrectCount: incorrect };
	}, [characterStates]);

	const wpm = useMemo(() => {
		return calculateWPM(correctCount, timer.elapsedMs);
	}, [correctCount, timer.elapsedMs]);

	const accuracy = useMemo(() => {
		return calculateAccuracy(correctCount, incorrectCount);
	}, [correctCount, incorrectCount]);

	const time = useMemo(() => {
		if (mode === "timed" && timer.remainingMs !== null) {
			return formatTime(timer.remainingMs);
		}
		return formatTime(timer.elapsedMs);
	}, [mode, timer.elapsedMs, timer.remainingMs]);

	// Fetch passage when difficulty changes
	const fetchNewPassage = useCallback(async () => {
		try {
			const res = await fetch(
				`/api/passages/action?difficulty=${difficulty.toLowerCase()}`,
				{ cache: "no-store" }
			);
			if (!res.ok) throw new Error("Failed to fetch passage");
			const data: Passage = await res.json();
			setPassage(data);
			setTestStatus("ready");
		} catch (error) {
			console.error("Failed to fetch passage:", error);
		}
	}, [difficulty]);

	useEffect(() => {
		fetchNewPassage();
	}, [fetchNewPassage]);

	// Typing handlers
	const startTest = useCallback(() => {
		if (testStatus !== "ready") return;
		setTestStatus("running");
		timer.start();
	}, [testStatus, timer]);

	const resetTest = useCallback(() => {
		setTypedValue("");
		setTestStatus("ready");
		timer.reset();
	}, [timer]);

	const handleTyping = useCallback((value: string) => {
		if (testStatus === "ready") {
			// Auto-start on first keystroke
			setTestStatus("running");
			timer.start();
		}
		
		if (testStatus !== "running") return;
		
		setTypedValue(value);
		
		// Check if passage is complete
		if (passage && value.length >= passage.text.length) {
			setTestStatus("completed");
			timer.complete();
		}
	}, [testStatus, passage, timer]);

	const value: GameState = useMemo(
		() => ({
			difficulty,
			mode,
			wpm,
			accuracy,
			time,
			passage,
			typedValue,
			characterStates,
			testStatus,
			cursorIndex,
			setDifficulty,
			setMode,
			startTest,
			resetTest,
			handleTyping,
			fetchNewPassage,
		}),
		[
			difficulty,
			mode,
			wpm,
			accuracy,
			time,
			passage,
			typedValue,
			characterStates,
			testStatus,
			cursorIndex,
			startTest,
			resetTest,
			handleTyping,
			fetchNewPassage,
		]
	);

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame() {
	return useContext(GameContext);
}

export default GameContext;
```

---

### 2. typing-test/TypingTestContainer.tsx

```tsx
"use client";

import { useGame } from "@/components/GameContext";
import TypingInput from "./TypingInput";
import PassageDisplay from "./PassageDisplay";

const TypingTestContainer: React.FC = () => {
	const game = useGame();

	// Loading state
	if (!game.passage) {
		return (
			<div className="w-full max-w-4xl mx-auto mt-8">
				<p className="text-gray-400 text-center">Loading passage...</p>
			</div>
		);
	}

	// Idle/Ready state - show instructions
	if (game.testStatus === "idle" || game.testStatus === "ready") {
		return (
			<div className="w-full max-w-4xl mx-auto mt-8">
				<PassageDisplay />
				<div className="mt-6 text-center">
					<p className="text-gray-400 mb-4">
						Click below and start typing to begin the test
					</p>
					<TypingInput />
				</div>
			</div>
		);
	}

	// Running state
	if (game.testStatus === "running") {
		return (
			<div className="w-full max-w-4xl mx-auto mt-8">
				<PassageDisplay />
				<TypingInput />
			</div>
		);
	}

	// Completed state
	if (game.testStatus === "completed") {
		return (
			<div className="w-full max-w-4xl mx-auto mt-8">
				<PassageDisplay />
				<div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
					<h2 className="text-2xl font-bold text-FemBlue-400 mb-4">Test Complete!</h2>
					<div className="grid grid-cols-3 gap-4 mb-6">
						<div>
							<p className="text-gray-400 text-sm">WPM</p>
							<p className="text-3xl font-bold text-gray-100">{game.wpm}</p>
						</div>
						<div>
							<p className="text-gray-400 text-sm">Accuracy</p>
							<p className="text-3xl font-bold text-gray-100">{game.accuracy}%</p>
						</div>
						<div>
							<p className="text-gray-400 text-sm">Time</p>
							<p className="text-3xl font-bold text-gray-100">{game.time}</p>
						</div>
					</div>
					<button
						onClick={game.resetTest}
						className="w-full px-6 py-3 bg-FemBlue-400 hover:bg-FemBlue-500 text-black font-semibold rounded transition"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return null;
};

export default TypingTestContainer;
```

---

### 3. typing-test/TypingInput.tsx

```tsx
"use client";

import { useGame } from "@/components/GameContext";
import { useRef, useEffect } from "react";

const TypingInput: React.FC = () => {
	const game = useGame();
	const inputRef = useRef<HTMLInputElement>(null);

	// Auto-focus when test is ready or running
	useEffect(() => {
		if (game.testStatus === "ready" || game.testStatus === "running") {
			inputRef.current?.focus();
		}
	}, [game.testStatus]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		game.handleTyping(e.target.value);
	};

	const handleBlur = () => {
		// Restore focus if test is running
		if (game.testStatus === "running") {
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	};

	if (game.testStatus === "completed") {
		return null;
	}

	return (
		<div className="w-full mt-4">
			<input
				ref={inputRef}
				type="text"
				value={game.typedValue}
				onChange={handleChange}
				onBlur={handleBlur}
				className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-gray-100 focus:outline-none focus:border-FemBlue-400 transition"
				placeholder="Start typing here..."
				disabled={game.testStatus === "idle"}
				aria-label="Typing input"
			/>
		</div>
	);
};

export default TypingInput;
```

---

### 4. typing-test/PassageDisplay.tsx

```tsx
"use client";

import { useGame } from "@/components/GameContext";
import CharacterSpan from "./CharacterSpan";

const PassageDisplay: React.FC = () => {
	const game = useGame();

	if (!game.passage) {
		return null;
	}

	const characters = game.passage.text.split("");

	return (
		<div className="w-full p-6 bg-gray-900 rounded-lg border border-gray-700">
			<div className="text-2xl md:text-3xl leading-relaxed font-medium">
				{characters.map((char, index) => {
					const charState = game.characterStates[index];
					const isCursor = index === game.cursorIndex;
					
					return (
						<CharacterSpan
							key={`${index}-${char}`}
							character={char}
							state={charState?.state || "untyped"}
							isCursor={isCursor}
							index={index}
						/>
					);
				})}
			</div>
		</div>
	);
};

export default PassageDisplay;
```

---

### 5. typing-test/CharacterSpan.tsx

```tsx
"use client";

import type { CharacterState } from "@/lib/types";

interface CharacterSpanProps {
	character: string;
	state: CharacterState["state"];
	isCursor: boolean;
	index: number;
}

const CharacterSpan: React.FC<CharacterSpanProps> = ({
	character,
	state,
	isCursor,
}) => {
	// Base classes
	let className = "inline-block relative ";

	// State-based color
	if (state === "correct") {
		className += "text-emerald-500 ";
	} else if (state === "incorrect") {
		className += "text-red-400 ";
	} else {
		className += "text-gray-400 ";
	}

	// Cursor indicator
	if (isCursor) {
		className += "border-b-2 border-FemBlue-400 ";
	}

	// Special character handling
	const displayChar = character === " " ? "\u00A0" : character;

	return (
		<span className={className} data-char={character}>
			{displayChar}
		</span>
	);
};

export default CharacterSpan;
```

---

### 6. lib/utils/typing-validation.ts

```typescript
import type { CharacterState } from "../types";

const NORMALIZATION_MAP: Record<string, string> = {
	"\u2018": "'", // Left single quote
	"\u2019": "'", // Right single quote
	"\u201C": '"', // Left double quote
	"\u201D": '"', // Right double quote
	"\u2014": "-", // Em dash
	"\u2013": "-", // En dash
};

/**
 * Normalize special characters to their ASCII equivalents
 */
export function normalizeCharacter(char: string): string {
	return NORMALIZATION_MAP[char] ?? char;
}

/**
 * Check if typed character matches expected character at given index
 */
export function isCharacterCorrect(
	typed: string,
	expected: string,
	index: number
): boolean {
	if (index >= typed.length) return false;
	
	const typedChar = normalizeCharacter(typed[index]);
	const expectedChar = normalizeCharacter(expected[index]);
	
	return typedChar === expectedChar;
}

/**
 * Validate entire typed input against passage
 * Returns array of character states for each character in passage
 */
export function validateTypedInput(
	typedValue: string,
	passage: string
): CharacterState[] {
	return passage.split("").map((char, index) => {
		if (index >= typedValue.length) {
			return { character: char, state: "untyped" as const, index };
		}
		
		const isCorrect = isCharacterCorrect(typedValue, passage, index);
		
		return {
			character: char,
			state: isCorrect ? ("correct" as const) : ("incorrect" as const),
			index,
		};
	});
}
```

---

### 7. lib/utils/metrics-calculation.ts

```typescript
/**
 * Calculate Words Per Minute
 * Formula: (characters typed / 5) / (elapsed time in minutes)
 * Standard: 1 word = 5 characters
 */
export function calculateWPM(correctCharCount: number, elapsedMs: number): number {
	if (elapsedMs === 0) return 0;
	
	const minutes = elapsedMs / 60000;
	const words = correctCharCount / 5;
	const wpm = words / minutes;
	
	return Math.round(Math.max(0, wpm));
}

/**
 * Calculate accuracy percentage
 * Formula: (correct / total) * 100
 */
export function calculateAccuracy(
	correctCount: number,
	incorrectCount: number
): number {
	const total = correctCount + incorrectCount;
	if (total === 0) return 100;
	
	const accuracy = (correctCount / total) * 100;
	return Math.round(Math.max(0, Math.min(100, accuracy)));
}

/**
 * Format milliseconds to "M:SS" format
 * Example: 65000ms → "1:05"
 */
export function formatTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
```

---

### 8. lib/types.ts (ADDITIONS)

```typescript
// Add these to existing types.ts

export interface CharacterState {
	character: string;
	state: "untyped" | "correct" | "incorrect";
	index: number;
}

export type TypingTestStatus = "idle" | "ready" | "running" | "completed";
```

---

### 9. app/page.tsx (UPDATED)

```tsx
import StatsContainter from "@/components/statsContainter";
import TypingTestContainer from "@/components/typing-test/TypingTestContainer";
import { GameProvider } from "@/components/GameContext";

export default function Home() {
	return (
		<GameProvider>
			<main className="flex flex-col items-center justify-start mt-16 p-4 md:px-16">
				<StatsContainter />
				<TypingTestContainer />
			</main>
		</GameProvider>
	);
}
```

---

## Implementation Checklist

### Phase 1: Setup & Utilities (Foundation)
- [ ] Add new types to `lib/types.ts` (`CharacterState`, `TypingTestStatus`)
- [ ] Create `lib/utils/typing-validation.ts` with validation functions
- [ ] Create `lib/utils/metrics-calculation.ts` with WPM/accuracy functions
- [ ] Test utility functions with unit tests (optional but recommended)

### Phase 2: Core Components (Building Blocks)
- [ ] Create `components/typing-test/CharacterSpan.tsx`
- [ ] Create `components/typing-test/PassageDisplay.tsx`
- [ ] Create `components/typing-test/TypingInput.tsx`
- [ ] Test each component in isolation

### Phase 3: GameContext Enhancement (State Management)
- [ ] Update `GameContext.tsx` with typing state
- [ ] Integrate `useTimer` hook into GameContext
- [ ] Add `handleTyping()` method
- [ ] Add `startTest()` and `resetTest()` methods
- [ ] Add passage fetching logic
- [ ] Test GameContext provides correct values

### Phase 4: Container & Integration (Orchestration)
- [ ] Create `components/typing-test/TypingTestContainer.tsx`
- [ ] Update `app/page.tsx` to use `TypingTestContainer`
- [ ] Test full typing flow (idle → ready → running → completed)
- [ ] Verify real-time WPM/accuracy updates in StatsContainer

### Phase 5: Polish & Testing (Refinement)
- [ ] Test keyboard focus behavior
- [ ] Test edge cases (empty input, backspace, special characters)
- [ ] Verify timer integration (timed vs passage mode)
- [ ] Add accessibility attributes (ARIA labels)
- [ ] Test responsive design on mobile
- [ ] Add error boundaries (optional)

### Phase 6: Performance Optimization (Optional)
- [ ] Profile React renders with React DevTools
- [ ] Add `React.memo()` to CharacterSpan if needed
- [ ] Verify `useMemo` dependencies in GameContext
- [ ] Test with large passages (500+ characters)

---

## Key Design Decisions

### Why GameContext Manages Typing State
**Pros:**
- Centralized state accessible from any component
- Easy to share typing metrics site-wide
- Timer and typing state naturally coupled
- StatsContainer automatically gets real-time updates

**Cons:**
- GameContext becomes larger and more complex
- More logic in context vs components

**Decision:** ✅ Use GameContext because typing state is global and needs to be shared across multiple components (stats, display, input).

---

### Why Separate TypingInput from PassageDisplay
**Pros:**
- Clear separation of concerns (input capture vs visual display)
- Easier to test each component independently
- PassageDisplay can be reused (e.g., in results screen)
- Input can be hidden/styled independently

**Cons:**
- More components to manage
- Need to coordinate focus state

**Decision:** ✅ Separate components for better maintainability and testability.

---

### Why Pure Functions in lib/utils
**Pros:**
- Testable without React
- Can be used in multiple contexts (components, hooks, server)
- Easy to debug and reason about
- Performance: can be memoized easily

**Cons:**
- More files to manage
- Indirection (need to import from utils)

**Decision:** ✅ Use pure functions because they promote testability and reusability.

---

### Why Character-by-Character Validation
**Pros:**
- Real-time feedback as user types
- Visual indication of progress
- Allows user to continue after mistakes
- Matches typing test UX standards

**Cons:**
- More complex rendering logic
- Potentially many DOM elements for long passages

**Decision:** ✅ Character-by-character validation provides the best UX and matches industry standards.

---

## Testing Considerations

### Unit Tests (Recommended)
```typescript
// Example: lib/utils/metrics-calculation.test.ts
describe("calculateWPM", () => {
  it("should return 0 when elapsed time is 0", () => {
    expect(calculateWPM(50, 0)).toBe(0);
  });

  it("should calculate WPM correctly for 1 minute", () => {
    // 50 characters = 10 words, 1 minute = 10 WPM
    expect(calculateWPM(50, 60000)).toBe(10);
  });

  it("should calculate WPM correctly for 30 seconds", () => {
    // 50 characters = 10 words, 30 seconds = 20 WPM
    expect(calculateWPM(50, 30000)).toBe(20);
  });
});
```

### Integration Tests (Optional)
- Test full typing flow: idle → ready → running → completed
- Verify WPM updates in real-time
- Test timer completion triggers test completion
- Test difficulty changes fetch new passages

### Manual Testing Checklist
- [ ] Type correct characters → green text
- [ ] Type incorrect characters → red text
- [ ] WPM increases as you type
- [ ] Accuracy decreases with mistakes
- [ ] Timer counts down (timed mode)
- [ ] Test completes when passage is finished
- [ ] Reset button works
- [ ] Difficulty changes fetch new passages
- [ ] Input stays focused during typing
- [ ] Works on mobile devices

---

## Future Enhancements (Out of Scope)

- **Backspace Support:** Allow users to correct mistakes
- **Error Highlighting:** Show specific incorrect characters with underline
- **Keyboard Shortcuts:** Add shortcuts for reset/new passage
- **Statistics History:** Track WPM/accuracy over time
- **Leaderboard:** Compare scores with other users
- **Custom Passages:** Allow users to upload their own text
- **Sound Effects:** Audio feedback for correct/incorrect keystrokes
- **Multiplayer:** Real-time typing races with friends

---

## Summary

This guide provides a comprehensive blueprint for implementing an interactive typing test. The architecture prioritizes:

1. **Separation of Concerns:** UI components separate from logic utilities
2. **Centralized State:** GameContext manages all typing state
3. **Reusability:** Pure functions and small components
4. **Testability:** Pure functions can be unit tested
5. **Performance:** Memoization prevents unnecessary re-renders
6. **Accessibility:** ARIA labels and keyboard navigation

**Next Steps:**
1. Review this guide thoroughly
2. Ask questions about any unclear sections
3. Begin implementation with Phase 1 (utilities)
4. Test each phase before moving to the next
5. Request code reviews after completing each phase

Good luck! 🚀
