# Typing Test Implementation Guide

**Project:** Typing Speed Test Application  
**Date:** December 27, 2025  
**Purpose:** Refactor and implement interactive typing test with real-time WPM/accuracy tracking

---

## Table of Contents

1. [Current Project Structure (BEFORE)](#current-project-structure-before)
2. [Desired Project Structure (AFTER)](#desired-project-structure-after)
3. [Responsibility Mapping](#responsibility-mapping)
4. [Component Code Examples](#component-code-examples)
5. [Implementation Checklist](#implementation-checklist)

---

## Current Project Structure (BEFORE)

```
src/
├─ app/
│  ├─ page.tsx                    // Main page - renders GameProvider with StatsContainer & TextContainer
│  ├─ layout.tsx                  // Root layout with Header/Footer
│  ├─ globals.css                 // Global styles
│  └─ api/
│     └─ passages/
│        ├─ route.ts              // REST API endpoint for fetching passages
│        └─ action/
│           └─ route.ts           // Server action wrapper for passages
│
├─ components/
│  ├─ GameContext.tsx             // Shared state (difficulty, mode, wpm, accuracy, time)
│  ├─ textcontainter.tsx          // Fetches and displays static passage text
│  ├─ statsContainter.tsx         // Displays WPM, accuracy, time, difficulty/mode toggles
│  ├─ header.tsx                  // Site header
│  ├─ footer.tsx                  // Site footer
│  └─ README.md                   // Component documentation
│
├─ lib/
│  ├─ types.ts                    // TypeScript types (Passage, TypingMetrics, TimerSnapshot, etc.)
│  ├─ passages.ts                 // Passage utility functions (getRandomPassage)
│  └─ hooks/
│     ├─ index.ts                 // Hook exports
│     ├─ useTimer.ts              // Timer hook with start/pause/reset (195 lines)
│     └─ useTypingTest.ts         // Typing test logic hook (198 lines)
│
└─ data/
   └─ data.json                   // Passage data organized by difficulty
```

### What Currently Works

- ✅ Fetches passages based on difficulty
- ✅ Displays static text passages
- ✅ Shows placeholder WPM/accuracy/time in stats
- ✅ Difficulty and mode toggles update GameContext
- ✅ Has existing `useTypingTest` and `useTimer` hooks (not currently integrated)

### What's Missing

- ❌ No input field for typing
- ❌ No real-time character validation
- ❌ No dynamic styling for correct/incorrect characters
- ❌ WPM/accuracy not calculated from actual typing
- ❌ Timer not integrated with typing activity
- ❌ GameContext not managing typing state

---

## Desired Project Structure (AFTER)

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
