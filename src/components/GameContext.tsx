"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { useTimer } from "@/lib/hooks";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { useStatistics } from "@/lib/hooks/useStatistics";
import type {
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

interface GameState {
	difficulty: Difficulty;
	mode: Mode;
	wpm: number;
	accuracy: number;
	time: string;

	passage: Passage | null;
	typedValue: string;
	characterStates: CharacterState[];
	testStatus: TypingTestStatus;
	cursorIndex: number;
	//userstatistics
	statistics: UserStatistics;

	//user stattistics setters and functions
	saveTestResult: (result: TestResult) => void;
	clearStatistics: () => void;

	// setters
	setDifficulty: (d: Difficulty) => void;
	setMode: (m: Mode) => void;

	// typeing test related setters
	startTest: () => void;
	resetTest: () => void;
	handleTyping: (input: string) => void;
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
	statistics: {
		totalTests: 0,
		bestWPM: 0,
		bestAccuracy: 0,
		averageWPM: 0,
		averageAccuracy: 0,
		recentTests: [],
		lastUpdated: new Date().toISOString(),
	},
	// typing test related methods - placeholders
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

	const { statistics, saveTestResult, clearStatistics } = useStatistics();

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

	// Character Validation
	const characterStates = useMemo(() => {
		if (!passage) return [];
		return validateTypedInput(typedValue, passage.text);
	}, [typedValue, passage]);

	const cursorIndex = typedValue.length;

	// calculate metrics
	const { correctCount, incorrectCount } = useMemo(() => {
		const correct = characterStates.filter(
			(status) => status.state === "correct",
		).length;
		const incorrect = characterStates.filter(
			(status) => status.state === "incorrect",
		).length;
		return { correctCount: correct, incorrectCount: incorrect };
	}, [characterStates]);

	// calculate words per minute (wpm)
	const wpm = useMemo(() => {
		return calculateWPM(correctCount, timer.elapsedMs);
	}, [correctCount, timer.elapsedMs]);

	//caluclate word accuracy rate
	const accuracy = useMemo(() => {
		return calculateAccuracy(correctCount, incorrectCount);
	}, [correctCount, incorrectCount]);

	const time = useMemo(() => {
		if (mode === "timed" && timer.remainingMs !== null) {
			return formatTime(timer.remainingMs); // Countdown for timed mode
		}
		return formatTime(timer.elapsedMs); // Count up for passage mode
	}, [mode, timer.elapsedMs, timer.remainingMs]);

	// fetch passage when difficulty changes
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

	// Define resetTest before the effects that use it
	const resetTest = useCallback(() => {
		setTypedValue("");
		setTestStatus("ready");
		timer.reset();
	}, [timer]);

	const startTest = useCallback(() => {
		if (testStatus !== "ready") return;
		setTestStatus("running");
		timer.start();
	}, [testStatus, timer]);

	useEffect(() => {
		fetchNewPassage();
	}, [fetchNewPassage]);

	// Use refs to store latest function references for mode change effect
	const resetTestRef = useRef(resetTest);
	const fetchNewPassageRef = useRef(fetchNewPassage);

	// Keep refs updated with latest function references
	useEffect(() => {
		resetTestRef.current = resetTest;
		fetchNewPassageRef.current = fetchNewPassage;
	});

	// Reset and fetch new passage when mode changes
	const isFirstRender = useRef(true);
	// biome-ignore lint/correctness/useExhaustiveDependencies: mode is intentionally the trigger - we want to run when mode changes
	useEffect(() => {
		// Skip the first render to avoid resetting on mount
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		resetTestRef.current();
		fetchNewPassageRef.current();
	}, [mode]);

	//typing handlers

	useKeyboardShortcuts({
		onReset: resetTest,
		onNewPassage: () => {
			void fetchNewPassage();
		},
		onCancel: () => {
			if (testStatus === "running") {
				resetTest();
				timer.reset();
			}
		},
		onStart: startTest,
		enabled: testStatus !== "idle",
	});

	const handleTyping = useCallback(
		(value: string) => {
			if (testStatus === "ready" && value.length > 0) {
				//autostart on first keystrock
				setTestStatus("running");
				timer.start();
			}
			if (testStatus !== "running") return;

			// Prevent typing beyond passage length
			if (passage && value.length > passage.text.length) {
				return; // ← Silently ignore extra characters
			}
			setTypedValue(value);

			// Check completion
			if (passage && value.length === passage.text.length) {
				setTestStatus("completed");
				// Use a slight delay to ensure timer has updated, or calculate directly
				const finalElapsedMs = timer.complete(); // Get the final time
				const result: TestResult = {
					wpm,
					accuracy,
					difficulty,
					mode,
					passageID: passage.id,
					completedAt: new Date().toISOString(),
					durationMs: finalElapsedMs,
				};
				saveTestResult(result);
			}
		},
		[
			testStatus,
			passage,
			timer,
			wpm,
			accuracy,
			difficulty,
			mode,
			saveTestResult,
		],
	);

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

			statistics,
			saveTestResult,
			clearStatistics,
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
			statistics,
			saveTestResult,
			clearStatistics,
		],
	);

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame() {
	return useContext(GameContext);
}

export default GameContext;
