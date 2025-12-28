"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import { useTimer } from "@/lib/hooks";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
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
import { useStatistics } from "@/lib/hooks/useStatistics";

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

	const timer = useTimer({
		duration: mode === "timed" ? 60000 : null,
		autoStart: false,
		onComplete: () => {
			setTestStatus("completed");
		},
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
			return formatTime(timer.remainingMs);
		}
		return formatTime(timer.elapsedMs);
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

	useEffect(() => {
		fetchNewPassage();
	}, [fetchNewPassage]);

	//typing handlers

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
			if (
				passage &&
				value.length === passage.text.length &&
				characterStates.every((s) => s.state === "correct")
			) {
				setTestStatus("completed");
				timer.complete();

				const result: TestResult = {
					wpm,
					accuracy,
					difficulty,
					mode,
					passageID: passage.id,
					completedAt: new Date().toISOString(),
					durationMs: timer.elapsedMs,
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
