# Typing Test Implementation Guide

This guide provides step-by-step instructions to implement the UI enhancements and animations for the typing test application.

---

## Table of Contents

1. [Prerequisites - Install GSAP](#step-1-prerequisites---install-gsap)
2. [Dynamic Color Coding for Stats](#step-2-dynamic-color-coding-for-stats)
3. [GSAP Color Change Animations](#step-3-gsap-color-change-animations)
4. [Character Impact Shake Animation](#step-4-character-impact-shake-animation)
5. [Start Typing Overlay Button](#step-5-start-typing-overlay-button)
6. [Confetti Animation on Completion](#step-6-confetti-animation-on-completion)
7. [Results Modal with GSAP Animations](#step-7-results-modal-with-gsap-animations)
8. [New Passage Reset Behavior](#step-8-new-passage-reset-behavior)

---

## Step 1: Prerequisites - Install GSAP

GSAP (GreenSock Animation Platform) is required for smooth animations. Install it first.

### Terminal Command

```bash
npm install gsap
```

### Why GSAP?

GSAP provides high-performance animations with better control than CSS animations alone. It handles:
- Smooth color transitions
- Shake effects with decay
- Fade in/out animations
- Complex sequenced animations

---

## Step 1.1: GSAP Best Practices for React (GSAP-Master Recommended)

> **⚠️ IMPORTANT**: The following section contains GSAP-Master validated patterns for React. These patterns ensure proper cleanup, prevent memory leaks, and guarantee 60fps performance.

### Install GSAP with React Hook Package

For optimal React integration, install the official GSAP React hook:

```bash
npm install gsap @gsap/react
```

### Why `@gsap/react`?

The `useGSAP` hook from `@gsap/react` provides:
- **Automatic cleanup** when components unmount
- **Proper scoping** for animations within a container
- **Memory leak prevention** - kills all animations automatically
- **React 18+ compatibility** with strict mode

### GSAP Setup Pattern for React Components

```tsx
// Recommended GSAP setup for React components
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Register the hook with GSAP (do this once, typically in a layout or provider)
gsap.registerPlugin(useGSAP);

// Performance defaults - apply once at app initialization
gsap.defaults({ 
  force3D: true,  // GPU acceleration for 60fps
  lazy: false     // Immediate rendering
});

export default function AnimatedComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  // useGSAP automatically handles cleanup on unmount
  useGSAP(() => {
    // All animations here are scoped to containerRef
    gsap.from(".animate-element", {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      force3D: true  // Always include for smooth animations
    });
  }, { scope: containerRef }); // Scope animations to container

  return (
    <div ref={containerRef}>
      <div className="animate-element">Content</div>
    </div>
  );
}
```

### Performance CSS (Required for 60fps)

Add this CSS to ensure smooth animations:

```css
/* Add to globals.css for animation performance */
.animated-element {
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0); /* Force GPU layer */
}

/* Respect user accessibility preferences */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none !important;
    transition: none !important;
  }
}
```

### Alternative: Using useEffect (Current Implementation)

If you prefer `useEffect` over `useGSAP`, you **MUST** manually handle cleanup:

```tsx
import { useEffect, useRef } from "react";
import gsap from "gsap";

function MyComponent() {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Create the animation context for cleanup
    const ctx = gsap.context(() => {
      gsap.fromTo(elementRef.current, 
        { scale: 1.2 }, 
        { scale: 1, duration: 0.3, ease: "back.out(1.7)", force3D: true }
      );
    });

    // CRITICAL: Clean up animations on unmount or dependency change
    return () => ctx.revert();
  }, [dependency]);

  return <div ref={elementRef}>Animated content</div>;
}
```

> **Note**: The `gsap.context()` API ensures all animations created within it are properly killed when `ctx.revert()` is called.

---

## Step 2: Dynamic Color Coding for Stats

### Overview

The stats display (WPM, Accuracy, Time) should change colors based on values and test status:

| Stat | Idle | Good | Medium | Poor |
|------|------|------|--------|------|
| Time | White | Yellow (running) | - | - |
| Accuracy | White | Green (>90%) | Yellow (70-90%) | Red (<70%) |
| WPM | White | Green (>40) | Yellow (20-40) | Red (<20) |

### File: `src/components/statsContainter.tsx`

#### Step 2.1: Add helper functions for color determination

**Add these functions AFTER the imports and BEFORE the `StatsContainter` component:**

```tsx
// Add after the existing import
import { useGame } from "./GameContext";

// Color determination helpers
function getTimeColor(testStatus: string): string {
    if (testStatus === "idle" || testStatus === "ready") {
        return "text-FemNeutral-000"; // White
    }
    return "text-FemYellow-400"; // Yellow when running or completed
}

function getAccuracyColor(accuracy: number, testStatus: string): string {
    if (testStatus === "idle" || testStatus === "ready") {
        return "text-FemNeutral-000"; // White
    }
    if (accuracy >= 90) return "text-FemGreen-500";  // Green
    if (accuracy >= 70) return "text-FemYellow-400"; // Yellow
    return "text-FemRed-500"; // Red
}

function getWpmColor(wpm: number, testStatus: string): string {
    if (testStatus === "idle" || testStatus === "ready") {
        return "text-FemNeutral-000"; // White
    }
    if (wpm > 40) return "text-FemGreen-500";  // Green
    if (wpm >= 20) return "text-FemYellow-400"; // Yellow
    return "text-FemRed-500"; // Red
}
```

#### Step 2.2: Update the stats display to use dynamic colors

**BEFORE (lines ~77-95):**
```tsx
<dl className="flex gap-6 text-lg ">
    <div className="flex aligns-center justify-center gap-2.5">
        <dt className="font-medium text-gray-400">WPM:</dt>
        <dd className=" border-r border-gray-700 pr-4">{currentWpm}</dd>
    </div>

    <div className="flex aligns-center justify-center gap-2.5">
        <dt className="font-medium text-gray-400">Accuracy</dt>
        <dd className="border-r border-gray-700 pr-4">
            {currentAccuracy}%
        </dd>
    </div>

    <div className="flex aligns-center justify-center gap-2.5">
        <dt className="font-medium text-gray-400">Time</dt>
        <dd className="">{currentTime}</dd>
    </div>
</dl>
```

**AFTER:**
```tsx
<dl className="flex gap-6 text-lg ">
    <div className="flex aligns-center justify-center gap-2.5">
        <dt className="font-medium text-gray-400">WPM:</dt>
        <dd className={`border-r border-gray-700 pr-4 transition-colors duration-300 ${getWpmColor(currentWpm, game.testStatus)}`}>
            {currentWpm}
        </dd>
    </div>

    <div className="flex aligns-center justify-center gap-2.5">
        <dt className="font-medium text-gray-400">Accuracy</dt>
        <dd className={`border-r border-gray-700 pr-4 transition-colors duration-300 ${getAccuracyColor(currentAccuracy, game.testStatus)}`}>
            {currentAccuracy}%
        </dd>
    </div>

    <div className="flex aligns-center justify-center gap-2.5">
        <dt className="font-medium text-gray-400">Time</dt>
        <dd className={`transition-colors duration-300 ${getTimeColor(game.testStatus)}`}>
            {currentTime}
        </dd>
    </div>
</dl>
```

---

## Step 3: GSAP Color Change Animations

### Overview

Add a subtle animation (scale pulse) when stats change color.

### File: `src/components/statsContainter.tsx`

#### Step 3.1: Update imports at the TOP of the file

**BEFORE:**
```tsx
"use client";

type Mode = "timed" | "passage";
```

**AFTER:**
```tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Mode = "timed" | "passage";
```

---

### Step 3.1.1: GSAP-Master Recommended Alternative (Best Practice)

> **⚠️ GSAP BEST PRACTICE**: The above `useEffect` pattern works but the GSAP-recommended approach for React is to use `useGSAP` hook with `gsap.context()` for automatic cleanup. Below is the improved version:

**GSAP-RECOMMENDED IMPORTS:**
```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Register plugin once (can be done in a parent layout)
gsap.registerPlugin(useGSAP);

type Mode = "timed" | "passage";
```

**GSAP-RECOMMENDED ANIMATION PATTERN:**

Instead of multiple `useEffect` hooks, use a single `useGSAP` with dependency tracking:

```tsx
const StatsContainter: React.FC<StatsContainterProps> = ({ /* props */ }) => {
    const game = useGame();
    const containerRef = useRef<HTMLDivElement>(null);
    const wpmRef = useRef<HTMLElement>(null);
    const accuracyRef = useRef<HTMLElement>(null);
    const timeRef = useRef<HTMLElement>(null);
    
    // Track previous colors to detect changes
    const prevColorsRef = useRef({
        wpm: "",
        accuracy: "",
        time: ""
    });

    // Calculate current colors
    const wpmColor = getWpmColor(currentWpm, game.testStatus);
    const accuracyColor = getAccuracyColor(currentAccuracy, game.testStatus);
    const timeColor = getTimeColor(game.testStatus);

    // GSAP-Master recommended: useGSAP with proper scoping and cleanup
    useGSAP(() => {
        // Animate WPM on color change
        if (prevColorsRef.current.wpm !== wpmColor && prevColorsRef.current.wpm !== "") {
            gsap.fromTo(wpmRef.current, 
                { scale: 1.2 }, 
                { 
                    scale: 1, 
                    duration: 0.3, 
                    ease: "back.out(1.7)",
                    force3D: true,  // GPU acceleration
                    clearProps: "scale"  // Clean up after animation
                }
            );
        }
        prevColorsRef.current.wpm = wpmColor;

        // Animate Accuracy on color change
        if (prevColorsRef.current.accuracy !== accuracyColor && prevColorsRef.current.accuracy !== "") {
            gsap.fromTo(accuracyRef.current, 
                { scale: 1.2 }, 
                { 
                    scale: 1, 
                    duration: 0.3, 
                    ease: "back.out(1.7)",
                    force3D: true,
                    clearProps: "scale"
                }
            );
        }
        prevColorsRef.current.accuracy = accuracyColor;

        // Animate Time on color change
        if (prevColorsRef.current.time !== timeColor && prevColorsRef.current.time !== "") {
            gsap.fromTo(timeRef.current, 
                { scale: 1.2 }, 
                { 
                    scale: 1, 
                    duration: 0.3, 
                    ease: "back.out(1.7)",
                    force3D: true,
                    clearProps: "scale"
                }
            );
        }
        prevColorsRef.current.time = timeColor;
        
    }, { 
        scope: containerRef,
        dependencies: [wpmColor, accuracyColor, timeColor]  // Re-run when colors change
    });

    // ... rest of component
};
```

**Key Improvements:**
- `force3D: true` - Enables GPU acceleration for 60fps animations
- `clearProps: "scale"` - Cleans up inline styles after animation completes
- `scope: containerRef` - Scopes all animations to prevent affecting other components
- `dependencies` array - Properly triggers re-runs when colors change
- **Automatic cleanup** - useGSAP handles cleanup on unmount

#### Step 3.2: Add refs and animation logic inside the component

**Inside the `StatsContainter` component, AFTER the existing variable declarations, ADD:**

```tsx
const StatsContainter: React.FC<StatsContainterProps> = ({
    wpm,
    accuracy,
    time,
    difficulty,
    mode,
    onDifficultyChange,
    onModeChange,
}) => {
    const game = useGame();

    // ADD THESE REFS
    const wpmRef = useRef<HTMLElement>(null);
    const accuracyRef = useRef<HTMLElement>(null);
    const timeRef = useRef<HTMLElement>(null);
    
    // Track previous colors to detect changes
    const prevColorsRef = useRef({
        wpm: "",
        accuracy: "",
        time: ""
    });

    // Existing code...
    const currentWpm = wpm ?? game.wpm;
    const currentAccuracy = accuracy ?? game.accuracy;
    const currentTime = time ?? game.time;
    const currentDifficulty = (difficulty ?? game.difficulty) as Difficulty;
    const currentMode = (mode ?? game.mode) as Mode;

    // ADD THESE: Calculate current colors
    const wpmColor = getWpmColor(currentWpm, game.testStatus);
    const accuracyColor = getAccuracyColor(currentAccuracy, game.testStatus);
    const timeColor = getTimeColor(game.testStatus);

    // ADD THESE: Animate on color change
    useEffect(() => {
        if (prevColorsRef.current.wpm !== wpmColor && prevColorsRef.current.wpm !== "") {
            gsap.fromTo(wpmRef.current, 
                { scale: 1.2 }, 
                { scale: 1, duration: 0.3, ease: "back.out(1.7)" }
            );
        }
        prevColorsRef.current.wpm = wpmColor;
    }, [wpmColor]);

    useEffect(() => {
        if (prevColorsRef.current.accuracy !== accuracyColor && prevColorsRef.current.accuracy !== "") {
            gsap.fromTo(accuracyRef.current, 
                { scale: 1.2 }, 
                { scale: 1, duration: 0.3, ease: "back.out(1.7)" }
            );
        }
        prevColorsRef.current.accuracy = accuracyColor;
    }, [accuracyColor]);

    useEffect(() => {
        if (prevColorsRef.current.time !== timeColor && prevColorsRef.current.time !== "") {
            gsap.fromTo(timeRef.current, 
                { scale: 1.2 }, 
                { scale: 1, duration: 0.3, ease: "back.out(1.7)" }
            );
        }
        prevColorsRef.current.time = timeColor;
    }, [timeColor]);

    // ... rest of the component
```

---

### Step 3.2.1: GSAP-Master Recommended useEffect Pattern (If Not Using useGSAP)

> **⚠️ IMPORTANT**: If you continue using `useEffect` instead of `useGSAP`, you should wrap animations in `gsap.context()` for proper cleanup. Here's the corrected pattern:

```tsx
// GSAP-RECOMMENDED: Using useEffect with gsap.context() for cleanup
useEffect(() => {
    // Create context for cleanup
    const ctx = gsap.context(() => {
        if (prevColorsRef.current.wpm !== wpmColor && prevColorsRef.current.wpm !== "") {
            gsap.fromTo(wpmRef.current, 
                { scale: 1.2 }, 
                { 
                    scale: 1, 
                    duration: 0.3, 
                    ease: "back.out(1.7)",
                    force3D: true,        // ADDED: GPU acceleration
                    clearProps: "scale"   // ADDED: Clean up inline styles
                }
            );
        }
        prevColorsRef.current.wpm = wpmColor;
    });

    // CRITICAL: Return cleanup function
    return () => ctx.revert();
}, [wpmColor]);

useEffect(() => {
    const ctx = gsap.context(() => {
        if (prevColorsRef.current.accuracy !== accuracyColor && prevColorsRef.current.accuracy !== "") {
            gsap.fromTo(accuracyRef.current, 
                { scale: 1.2 }, 
                { 
                    scale: 1, 
                    duration: 0.3, 
                    ease: "back.out(1.7)",
                    force3D: true,
                    clearProps: "scale"
                }
            );
        }
        prevColorsRef.current.accuracy = accuracyColor;
    });

    return () => ctx.revert();
}, [accuracyColor]);

useEffect(() => {
    const ctx = gsap.context(() => {
        if (prevColorsRef.current.time !== timeColor && prevColorsRef.current.time !== "") {
            gsap.fromTo(timeRef.current, 
                { scale: 1.2 }, 
                { 
                    scale: 1, 
                    duration: 0.3, 
                    ease: "back.out(1.7)",
                    force3D: true,
                    clearProps: "scale"
                }
            );
        }
        prevColorsRef.current.time = timeColor;
    });

    return () => ctx.revert();
}, [timeColor]);
```

**Why This Matters:**
- `gsap.context()` groups animations together for batch cleanup
- `ctx.revert()` kills all animations AND reverts DOM changes
- `force3D: true` enables GPU hardware acceleration for smooth 60fps
- `clearProps` removes inline styles after animation preventing CSS conflicts

#### Step 3.3: Attach refs to the dd elements

**Update the `<dd>` elements to include refs:**

```tsx
<dd 
    ref={wpmRef}
    className={`border-r border-gray-700 pr-4 transition-colors duration-300 ${wpmColor}`}
>
    {currentWpm}
</dd>

<dd 
    ref={accuracyRef}
    className={`border-r border-gray-700 pr-4 transition-colors duration-300 ${accuracyColor}`}
>
    {currentAccuracy}%
</dd>

<dd 
    ref={timeRef}
    className={`transition-colors duration-300 ${timeColor}`}
>
    {currentTime}
</dd>
```

---

## Step 4: Character Impact Shake Animation

### Overview

Add a subtle shake effect to the passage display when the user types with high accuracy (>90%) for more than 5 seconds and has typed more than 20 characters.

### File: `src/components/typing-test/PassageDisplay.tsx`

**BEFORE (entire file):**
```tsx
"use client";

import { useGame } from "../GameContext";
import CharacterSpan from "./CharacterSpan";

const PassageDisplay: React.FC = () => {
    const game = useGame();

    if (!game.passage) return null;

    const characters = game.passage.text.split("");

    return (
        <div className="text-2xl md:text-3xl leading-relaxed font-medium  w-full">
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
    );
};

export default PassageDisplay;
```

**AFTER (entire file):**
```tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGame } from "../GameContext";
import CharacterSpan from "./CharacterSpan";

const PassageDisplay: React.FC = () => {
    const game = useGame();
    const containerRef = useRef<HTMLDivElement>(null);
    const highAccuracyStartRef = useRef<number | null>(null);
    const prevTypedLengthRef = useRef(0);

    // Track high accuracy duration
    useEffect(() => {
        if (game.accuracy >= 90 && game.testStatus === "running") {
            if (highAccuracyStartRef.current === null) {
                highAccuracyStartRef.current = Date.now();
            }
        } else {
            highAccuracyStartRef.current = null;
        }
    }, [game.accuracy, game.testStatus]);

    // Shake effect on character typed (with conditions)
    useEffect(() => {
        const currentLength = game.typedValue.length;
        const hasTypedNewChar = currentLength > prevTypedLengthRef.current;
        prevTypedLengthRef.current = currentLength;

        if (!hasTypedNewChar || !containerRef.current) return;

        // Check conditions: >90% accuracy, >5 seconds at high accuracy, >20 chars typed
        const highAccuracyDuration = highAccuracyStartRef.current 
            ? (Date.now() - highAccuracyStartRef.current) / 1000 
            : 0;

        if (
            game.accuracy >= 90 && 
            highAccuracyDuration > 5 && 
            currentLength > 20
        ) {
            // Micro-shake with decay
            gsap.fromTo(
                containerRef.current,
                { x: -1 },
                { 
                    x: 0, 
                    duration: 0.1, 
                    ease: "elastic.out(1, 0.3)",
                    overwrite: true
                }
            );
        }
    }, [game.typedValue, game.accuracy]);

    // Reset tracking when test resets
    useEffect(() => {
        if (game.testStatus === "ready" || game.testStatus === "idle") {
            highAccuracyStartRef.current = null;
            prevTypedLengthRef.current = 0;
        }
    }, [game.testStatus]);

    if (!game.passage) return null;

    const characters = game.passage.text.split("");

    return (
        <div 
            ref={containerRef}
            className="text-2xl md:text-3xl leading-relaxed font-medium w-full"
        >
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
    );
};

export default PassageDisplay;
```

---

### Step 4.1: GSAP-Master Recommended Pattern for PassageDisplay

> **⚠️ GSAP BEST PRACTICE**: The shake animation above works but can be improved with proper cleanup and GPU acceleration. Below is the optimized version:

**GSAP-RECOMMENDED ALTERNATIVE (Using useGSAP):**

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useGame } from "../GameContext";
import CharacterSpan from "./CharacterSpan";

// Register once at app level if not already done
gsap.registerPlugin(useGSAP);

const PassageDisplay: React.FC = () => {
    const game = useGame();
    const containerRef = useRef<HTMLDivElement>(null);
    const highAccuracyStartRef = useRef<number | null>(null);
    const prevTypedLengthRef = useRef(0);

    // Using useGSAP for automatic cleanup and proper React integration
    useGSAP(() => {
        const currentLength = game.typedValue.length;
        const hasTypedNewChar = currentLength > prevTypedLengthRef.current;
        prevTypedLengthRef.current = currentLength;

        // Track high accuracy duration
        if (game.accuracy >= 90 && game.testStatus === "running") {
            if (highAccuracyStartRef.current === null) {
                highAccuracyStartRef.current = Date.now();
            }
        } else {
            highAccuracyStartRef.current = null;
        }

        // Reset tracking when test resets
        if (game.testStatus === "ready" || game.testStatus === "idle") {
            highAccuracyStartRef.current = null;
            prevTypedLengthRef.current = 0;
            return; // Exit early, no animation needed
        }

        if (!hasTypedNewChar || !containerRef.current) return;

        // Check conditions: >90% accuracy, >5 seconds at high accuracy, >20 chars typed
        const highAccuracyDuration = highAccuracyStartRef.current 
            ? (Date.now() - highAccuracyStartRef.current) / 1000 
            : 0;

        if (
            game.accuracy >= 90 && 
            highAccuracyDuration > 5 && 
            currentLength > 20
        ) {
            // GSAP-OPTIMIZED: Micro-shake with GPU acceleration
            gsap.fromTo(
                containerRef.current,
                { x: -1 },
                { 
                    x: 0, 
                    duration: 0.1, 
                    ease: "elastic.out(1, 0.3)",
                    overwrite: true,       // Kill any existing animations
                    force3D: true,         // ADDED: GPU acceleration
                    clearProps: "x"        // ADDED: Clean up after animation
                }
            );
        }
    }, { 
        scope: containerRef,
        dependencies: [game.typedValue, game.accuracy, game.testStatus]
    });

    if (!game.passage) return null;

    const characters = game.passage.text.split("");

    return (
        <div 
            ref={containerRef}
            className="text-2xl md:text-3xl leading-relaxed font-medium w-full animated-element"
        >
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
    );
};

export default PassageDisplay;
```

**Key Improvements:**
- Uses `useGSAP` for automatic animation cleanup
- `force3D: true` enables hardware acceleration
- `clearProps: "x"` removes inline transform after animation
- `overwrite: true` prevents animation queue buildup
- Added `animated-element` class for CSS performance optimizations
- Single hook manages all state tracking and animation

---

## Step 5: Start Typing Overlay Button

### Overview

Create a blue button overlay that says "Start typing test" with "or click the text and start typing" below it. This button:
- Blurs the text area behind it when visible
- Fades out when user starts typing
- Fades back in when test is reset or new passage loads

### File: `src/components/typing-test/StartOverlay.tsx` (CREATE NEW FILE)

```tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGame } from "../GameContext";

const StartOverlay: React.FC = () => {
    const game = useGame();
    const overlayRef = useRef<HTMLDivElement>(null);
    const isVisible = game.testStatus === "ready" || game.testStatus === "idle";

    useEffect(() => {
        if (!overlayRef.current) return;

        if (isVisible) {
            // Fade in
            gsap.to(overlayRef.current, {
                opacity: 1,
                duration: 0.3,
                ease: "power2.out",
                display: "flex"
            });
        } else {
            // Fade out
            gsap.to(overlayRef.current, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    if (overlayRef.current) {
                        overlayRef.current.style.display = "none";
                    }
                }
            });
        }
    }, [isVisible]);

    const handleClick = () => {
        // Focus the hidden input to start typing
        const input = document.querySelector('input[aria-label="Typing input"]') as HTMLInputElement;
        input?.focus();
    };

    return (
        <div
            ref={overlayRef}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-FemNeutral-900/80 backdrop-blur-sm rounded-lg"
            style={{ opacity: isVisible ? 1 : 0, display: isVisible ? "flex" : "none" }}
        >
            <button
                onClick={handleClick}
                className="px-8 py-4 bg-FemBlue-600 hover:bg-FemBlue-400 text-white text-xl font-semibold rounded-lg transition-colors shadow-lg shadow-FemBlue-600/30"
                type="button"
            >
                Start typing test
            </button>
            <p className="mt-3 text-FemNeutral-400 text-sm">
                or click the text and start typing
            </p>
        </div>
    );
};

export default StartOverlay;
```

---

### Step 5.1: GSAP-Master Recommended Pattern for StartOverlay

> **⚠️ GSAP BEST PRACTICE**: The overlay animation benefits from proper cleanup and the `useGSAP` hook pattern. Here's the optimized version with timeline for better sequencing:

**GSAP-RECOMMENDED ALTERNATIVE:**

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useGame } from "../GameContext";

// Register once at app level if not already done
gsap.registerPlugin(useGSAP);

const StartOverlay: React.FC = () => {
    const game = useGame();
    const overlayRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const isVisible = game.testStatus === "ready" || game.testStatus === "idle";

    // GSAP-Master recommended: useGSAP with timeline for sequenced animations
    useGSAP(() => {
        if (!overlayRef.current) return;

        // Create a timeline for better control
        const tl = gsap.timeline();

        if (isVisible) {
            // Set initial state before animating in
            gsap.set(overlayRef.current, { display: "flex" });
            
            // Fade in with staggered button and text
            tl.to(overlayRef.current, {
                opacity: 1,
                duration: 0.3,
                ease: "power2.out",
                force3D: true
            })
            .from(buttonRef.current, {
                y: 10,
                opacity: 0,
                duration: 0.3,
                ease: "back.out(1.7)",
                force3D: true,
                clearProps: "y"  // Clean up transform after animation
            }, "-=0.15")
            .from(textRef.current, {
                y: 5,
                opacity: 0,
                duration: 0.2,
                ease: "power2.out",
                force3D: true,
                clearProps: "y"
            }, "-=0.1");
        } else {
            // Fade out
            tl.to(overlayRef.current, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                force3D: true,
                onComplete: () => {
                    if (overlayRef.current) {
                        gsap.set(overlayRef.current, { display: "none" });
                    }
                }
            });
        }

        // Return cleanup function - timeline will be killed automatically by useGSAP
        return () => {
            tl.kill();
        };
    }, { 
        scope: overlayRef,
        dependencies: [isVisible]
    });

    const handleClick = () => {
        // Focus the hidden input to start typing
        const input = document.querySelector('input[aria-label="Typing input"]') as HTMLInputElement;
        input?.focus();
    };

    return (
        <div
            ref={overlayRef}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-FemNeutral-900/80 backdrop-blur-sm rounded-lg animated-element"
            style={{ opacity: isVisible ? 1 : 0, display: isVisible ? "flex" : "none" }}
        >
            <button
                ref={buttonRef}
                onClick={handleClick}
                className="px-8 py-4 bg-FemBlue-600 hover:bg-FemBlue-400 text-white text-xl font-semibold rounded-lg transition-colors shadow-lg shadow-FemBlue-600/30"
                type="button"
            >
                Start typing test
            </button>
            <p ref={textRef} className="mt-3 text-FemNeutral-400 text-sm">
                or click the text and start typing
            </p>
        </div>
    );
};

export default StartOverlay;
```

**Key Improvements:**
- Uses `gsap.timeline()` for sequenced animations (button → text)
- `useGSAP` handles automatic cleanup when component unmounts
- `force3D: true` on all animations for GPU acceleration
- `clearProps` removes transforms after animation
- Staggered entrance animation for polish (button slides in before text)
- Refs on individual elements for targeted animations
- Added `animated-element` class for CSS performance optimizations

### File: `src/components/typing-test/TypingTestContainter.tsx`

**Add the import at the top:**
```tsx
import StartOverlay from "./StartOverlay";
```

**Update the Idle/Ready state section:**

**BEFORE:**
```tsx
// Idle/Ready state - show instructions
if (game.testStatus === "idle" || game.testStatus === "ready") {
    return (
        <div className="w-full  mx-auto mt-8 text-pretty">
            <div className="relative">
                <PassageDisplay />
                <TypingInput />
            </div>
            <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                    Click the text above and start typing to begin
                </p>
            </div>
        </div>
    );
}
```

**AFTER:**
```tsx
// Idle/Ready state - show overlay
if (game.testStatus === "idle" || game.testStatus === "ready") {
    return (
        <div className="w-full mx-auto mt-8 text-pretty">
            <div className="relative">
                <PassageDisplay />
                <TypingInput />
                <StartOverlay />
            </div>
        </div>
    );
}
```

---

## Step 6: Confetti Animation on Completion

### Overview

Create a canvas-based confetti animation that plays for 3 seconds when the user completes a test.

### File: `src/components/typing-test/Confetti.tsx` (CREATE NEW FILE)

```tsx
"use client";

import { useEffect, useRef, useCallback } from "react";

interface ConfettiProps {
    isActive: boolean;
    duration?: number; // in milliseconds
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
}

const COLORS = ["#4ca6ff", "#4dd67b", "#f4dc73", "#d64d5b", "#177dff", "#ffffff"];

const Confetti: React.FC<ConfettiProps> = ({ isActive, duration = 3000 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const createParticle = useCallback((canvas: HTMLCanvasElement): Particle => {
        return {
            x: Math.random() * canvas.width,
            y: -10,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * 3 + 2,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: Math.random() * 8 + 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        };
    }, []);

    useEffect(() => {
        if (!isActive || !canvasRef.current) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Initialize particles
        particlesRef.current = Array.from({ length: 150 }, () => createParticle(canvas));
        startTimeRef.current = Date.now();

        const animate = () => {
            const elapsed = Date.now() - (startTimeRef.current || 0);
            
            if (elapsed > duration) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Add new particles periodically
            if (elapsed < duration * 0.7 && Math.random() > 0.7) {
                particlesRef.current.push(createParticle(canvas));
            }

            particlesRef.current = particlesRef.current.filter((p) => {
                // Update position
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // Gravity
                p.rotation += p.rotationSpeed;

                // Draw particle
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();

                // Keep particle if still visible
                return p.y < canvas.height + 20;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isActive, duration, createParticle]);

    if (!isActive) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ width: "100vw", height: "100vh" }}
        />
    );
};

export default Confetti;
```

### File: `src/components/typing-test/TypingTestContainter.tsx`

**Add the import:**
```tsx
import Confetti from "./Confetti";
```

**Add state for confetti (near other useState declarations):**
```tsx
const [showConfetti, setShowConfetti] = useState(false);
```

**Update the completion effect:**

**BEFORE:**
```tsx
// Show modal when test completes
useEffect(() => {
    if (game.testStatus === "completed") {
        setShowResultsModal(true);
    }
}, [game.testStatus]);
```

**AFTER:**
```tsx
// Show modal and confetti when test completes
useEffect(() => {
    if (game.testStatus === "completed") {
        setShowResultsModal(true);
        setShowConfetti(true);
        
        // Stop confetti after 3 seconds
        const timer = setTimeout(() => {
            setShowConfetti(false);
        }, 3000);
        
        return () => clearTimeout(timer);
    }
}, [game.testStatus]);
```

**Add Confetti component at the start of the return JSX (wrap everything in a fragment if needed):**

```tsx
return (
    <>
        <Confetti isActive={showConfetti} duration={3000} />
        {/* ... rest of the component JSX */}
    </>
);
```

---

## Step 7: Results Modal with GSAP Animations

### Overview

Update the existing Results Modal to:
- Have smooth fade-in animation when appearing
- Have fade-out animation when closing
- Only overlay the text area and stats container (not header/footer)

### File: `src/components/typing-test/ResultsModel.tsx`

**BEFORE (top section):**
```tsx
"use client";

import { useGame } from "../GameContext";

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
            <button
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
                type="button"
            />
```

**AFTER (top section with GSAP):**
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGame } from "../GameContext";

interface ResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ isOpen, onClose }) => {
    const game = useGame();
    const backdropRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [shouldRender, setShouldRender] = useState(false);

    // Handle render state
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
        }
    }, [isOpen]);

    // Animate in when modal opens
    useEffect(() => {
        if (!shouldRender) return;

        const backdrop = backdropRef.current;
        const modal = modalRef.current;

        if (isOpen && backdrop && modal) {
            // Animate in
            gsap.fromTo(
                backdrop,
                { opacity: 0 },
                { opacity: 1, duration: 0.3, ease: "power2.out" }
            );
            gsap.fromTo(
                modal,
                { opacity: 0, scale: 0.9, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
            );
        }
    }, [isOpen, shouldRender]);

    // Handle close with animation
    const handleClose = () => {
        const backdrop = backdropRef.current;
        const modal = modalRef.current;

        if (backdrop && modal) {
            // Animate out
            gsap.to(modal, {
                opacity: 0,
                scale: 0.9,
                y: 20,
                duration: 0.25,
                ease: "power2.in"
            });
            gsap.to(backdrop, {
                opacity: 0,
                duration: 0.25,
                ease: "power2.in",
                onComplete: () => {
                    setShouldRender(false);
                    onClose();
                }
            });
        } else {
            onClose();
        }
    };

    if (!shouldRender) return null;

    const isNewBest = game.wpm > (game.statistics.bestWPM || 0);

    return (
        // Changed from "fixed" to "absolute" to only overlay the parent container
        <div 
            ref={backdropRef}
            className="absolute inset-0 z-50 flex items-center justify-center"
        >
            {/* Backdrop */}
            <button
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
                type="button"
                aria-label="Close modal"
            />

            {/* Modal Content - add ref */}
            <div 
                ref={modalRef}
                className="relative z-10 w-full max-w-md mx-4 p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl"
            >
```

---

### Step 7.1: GSAP-Master Recommended Pattern for ResultsModal

> **⚠️ GSAP BEST PRACTICE**: The ResultsModal can be improved with `useGSAP` for proper cleanup and a timeline for coordinated animations. Here's the optimized version:

**GSAP-RECOMMENDED ALTERNATIVE:**

```tsx
"use client";

import { useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useGame } from "../GameContext";

// Register once at app level if not already done
gsap.registerPlugin(useGSAP);

interface ResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ isOpen, onClose }) => {
    const game = useGame();
    const containerRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLButtonElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [shouldRender, setShouldRender] = useState(false);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

    // Handle render state when isOpen changes
    useGSAP(() => {
        if (isOpen && !shouldRender) {
            setShouldRender(true);
        }
    }, { dependencies: [isOpen] });

    // GSAP-Master recommended: useGSAP with timeline for sequenced modal animations
    useGSAP(() => {
        if (!shouldRender || !backdropRef.current || !modalRef.current) return;

        // Create and store timeline for later use in close animation
        const tl = gsap.timeline({ paused: true });
        
        tl.fromTo(
            backdropRef.current,
            { opacity: 0 },
            { 
                opacity: 1, 
                duration: 0.3, 
                ease: "power2.out",
                force3D: true
            }
        )
        .fromTo(
            modalRef.current,
            { opacity: 0, scale: 0.9, y: 20 },
            { 
                opacity: 1, 
                scale: 1, 
                y: 0, 
                duration: 0.4, 
                ease: "back.out(1.7)",
                force3D: true,
                clearProps: "scale,y"  // Clean up transforms after animation
            },
            "-=0.15"  // Overlap with backdrop fade
        );

        timelineRef.current = tl;

        // Play the animation when modal opens
        if (isOpen) {
            tl.play();
        }

        // Cleanup function - kill timeline when component unmounts
        return () => {
            tl.kill();
        };
    }, { 
        scope: containerRef,
        dependencies: [shouldRender, isOpen]
    });

    // GSAP-optimized close handler with animation
    const handleClose = useCallback(() => {
        if (!backdropRef.current || !modalRef.current) {
            onClose();
            return;
        }

        // Create exit timeline
        const exitTl = gsap.timeline({
            onComplete: () => {
                setShouldRender(false);
                onClose();
            }
        });

        exitTl
            .to(modalRef.current, {
                opacity: 0,
                scale: 0.9,
                y: 20,
                duration: 0.25,
                ease: "power2.in",
                force3D: true
            })
            .to(backdropRef.current, {
                opacity: 0,
                duration: 0.25,
                ease: "power2.in",
                force3D: true
            }, "-=0.2");
    }, [onClose]);

    if (!shouldRender) return null;

    const isNewBest = game.wpm > (game.statistics.bestWPM || 0);

    return (
        <div 
            ref={containerRef}
            className="absolute inset-0 z-50 flex items-center justify-center"
        >
            {/* Backdrop */}
            <button
                ref={backdropRef}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animated-element"
                onClick={handleClose}
                type="button"
                aria-label="Close modal"
                style={{ opacity: 0 }}  // Initial state for GSAP
            />

            {/* Modal Content */}
            <div 
                ref={modalRef}
                className="relative z-10 w-full max-w-md mx-4 p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl animated-element"
                style={{ opacity: 0, transform: 'scale(0.9) translateY(20px)' }}  // Initial state
            >
                {/* ... rest of modal content ... */}
            </div>
        </div>
    );
};

export default ResultsModal;
```

**Key Improvements:**
- Uses `useGSAP` for automatic cleanup when component unmounts
- Timeline stored in ref for access in close handler
- `force3D: true` on all animations for GPU acceleration  
- `clearProps` removes transforms after entrance animation
- Coordinated entrance/exit timelines with overlapping animations
- `useCallback` for stable close handler reference
- Initial styles set for GSAP to animate from
- Added `animated-element` class for CSS performance optimizations

---

**Also update all `onClick={onClose}` to `onClick={handleClose}` in the buttons:**

```tsx
{/* Action Buttons */}
<div className="flex gap-3">
    <button
        onClick={() => {
            game.resetTest();
            handleClose();  // Changed from onClose
        }}
        className="flex-1 px-6 py-3 bg-FemBlue-400 hover:bg-FemBlue-500 text-black font-semibold rounded-lg transition"
        type="button"
    >
        Try Again
    </button>
    <button
        onClick={() => {
            game.fetchNewPassage();
            handleClose();  // Changed from onClose
        }}
        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg transition"
        type="button"
    >
        New Passage
    </button>
</div>
```

### File: `src/components/typing-test/TypingTestContainter.tsx` - Complete Refactor

**Replace the entire component with this structure to ensure modal positioning:**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/components/GameContext";
import PassageDisplay from "./PassageDisplay";
import ResultsModal from "./ResultsModel";
import TypingInput from "./TypingInput";
import StartOverlay from "./StartOverlay";
import Confetti from "./Confetti";

const TypingTestContainer: React.FC = () => {
    const game = useGame();
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Show modal and confetti when test completes
    useEffect(() => {
        if (game.testStatus === "completed") {
            setShowResultsModal(true);
            setShowConfetti(true);
            
            // Stop confetti after 3 seconds
            const timer = setTimeout(() => {
                setShowConfetti(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [game.testStatus]);

    // Loading state
    if (!game.passage) {
        return (
            <div className="w-full mx-auto mt-8 text-pretty">
                <p className="text-gray-400 text-center">Loading passage...</p>
            </div>
        );
    }

    return (
        <>
            <Confetti isActive={showConfetti} duration={3000} />
            
            {/* Relative container for modal positioning - modal only covers this area */}
            <div className="relative w-full mx-auto mt-8 text-pretty min-h-[200px]">
                {/* Passage display area */}
                <div className="relative">
                    <PassageDisplay />
                    {game.testStatus !== "completed" && <TypingInput />}
                    {(game.testStatus === "idle" || game.testStatus === "ready") && (
                        <StartOverlay />
                    )}
                </div>

                {/* Results Modal - positioned absolute within this container */}
                <ResultsModal
                    isOpen={showResultsModal}
                    onClose={() => setShowResultsModal(false)}
                />
            </div>
        </>
    );
};

export default TypingTestContainer;
```

---

## Step 8: New Passage Reset Behavior

### Overview

When a new passage is loaded, ensure the timer and typed values are reset.

### File: `src/components/GameContext.tsx`

**Verify/Update the `fetchNewPassage` function to reset state:**

**BEFORE (if it doesn't reset):**
```tsx
const fetchNewPassage = useCallback(async () => {
    try {
        const res = await fetch(
            `/api/passages/action?difficulty=${difficulty.toLowerCase()}`,
            { cache: "no-store" },
        );
        if (!res.ok) throw new Error("Failed to fetch passage");
        const data: Passage = await res.json();
        setPassage(data);
        setTestStatus("ready");
    } catch (error) {
        console.error("Failed to fetch passage:", error);
    }
}, [difficulty]);
```

**AFTER (with reset):**
```tsx
const fetchNewPassage = useCallback(async () => {
    try {
        // Reset state before fetching new passage
        setTypedValue("");
        timer.reset();
        
        const res = await fetch(
            `/api/passages/action?difficulty=${difficulty.toLowerCase()}`,
            { cache: "no-store" },
        );
        if (!res.ok) throw new Error("Failed to fetch passage");
        const data: Passage = await res.json();
        setPassage(data);
        setTestStatus("ready");
    } catch (error) {
        console.error("Failed to fetch passage:", error);
    }
}, [difficulty, timer]);
```

---

## Summary Checklist

After implementing all changes, verify the following:

### Core Functionality
- [ ] **GSAP installed** - Run `npm install gsap @gsap/react`
- [ ] **Stats colors change dynamically** based on values and test status
- [ ] **Stats animate** (scale pulse) when colors change
- [ ] **Passage shakes subtly** when typing with >90% accuracy for >5 seconds with >20 chars typed
- [ ] **Start overlay** appears with blur effect, fades out when typing begins
- [ ] **Confetti animation** plays for 3 seconds on test completion
- [ ] **Results modal** fades in/out smoothly with GSAP
- [ ] **Modal only overlays** the typing area, not header/footer
- [ ] **New passage** properly resets timer and typed values

### GSAP-Master Best Practices (Recommended)
- [ ] **@gsap/react package installed** - For `useGSAP` hook
- [ ] **useGSAP hook used** - Instead of useEffect for automatic cleanup
- [ ] **gsap.registerPlugin(useGSAP)** - Called once at app initialization
- [ ] **force3D: true** - Added to all animations for GPU acceleration
- [ ] **clearProps** - Used after animations to clean up inline styles
- [ ] **gsap.context()** - Used if sticking with useEffect pattern
- [ ] **Cleanup functions** - Return `ctx.revert()` in useEffect cleanup
- [ ] **animated-element CSS class** - Applied to animated elements
- [ ] **Performance CSS added** - will-change, backface-visibility, transform: translateZ(0)
- [ ] **Reduced motion media query** - Respects user accessibility preferences

---

## File Changes Summary

| File | Action |
|------|--------|
| `package.json` | Add `gsap` and `@gsap/react` via `npm install gsap @gsap/react` |
| `src/app/globals.css` | Add `.animated-element` CSS class and reduced-motion media query |
| `src/components/statsContainter.tsx` | Add imports, color helpers, refs, GSAP animations |
| `src/components/typing-test/PassageDisplay.tsx` | Add GSAP shake animation effect |
| `src/components/typing-test/StartOverlay.tsx` | **CREATE NEW FILE** - Overlay button component |
| `src/components/typing-test/Confetti.tsx` | **CREATE NEW FILE** - Canvas confetti component |
| `src/components/typing-test/ResultsModel.tsx` | Add GSAP fade in/out animations, change positioning |
| `src/components/typing-test/TypingTestContainter.tsx` | Integrate overlay, confetti, restructure for modal |
| `src/components/GameContext.tsx` | Ensure `fetchNewPassage` resets timer and typedValue |

---

## GSAP-Master Quick Reference

### Essential Imports for React
```tsx
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Register once (in layout.tsx or App.tsx)
gsap.registerPlugin(useGSAP);
```

### Performance Defaults (Set Once)
```tsx
gsap.defaults({ 
  force3D: true,   // GPU acceleration
  lazy: false      // Immediate rendering
});
```

### Animation Pattern Template
```tsx
useGSAP(() => {
  gsap.fromTo(element, 
    { /* from state */ },
    { 
      /* to state */,
      force3D: true,
      clearProps: "transform"  // Clean up after animation
    }
  );
}, { 
  scope: containerRef,     // Scope animations
  dependencies: [trigger]  // Re-run when trigger changes
});
```

### If Using useEffect Instead
```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.fromTo(/* animation */);
  });
  return () => ctx.revert();  // CRITICAL: Always cleanup
}, [dependency]);
```
