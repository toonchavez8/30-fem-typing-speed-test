export type Difficulty = "easy" | "medium" | "hard";
export type Mode = "timed" | "passage";

export interface Passage {
	id: string;
	text: string;
	difficulty: Difficulty;
}

export type PassageBuckets = Record<Difficulty, Passage[]>;

export type TimerStatus = "idle" | "running" | "paused" | "completed";

export interface TimerSnapshot {
	status: TimerStatus;
	elapsedMs: number;
	remainingMs: number | null;
	elapsedSeconds: number;
	remainingSeconds: number | null;
	progress: number | null;
}

export type TypingTestStatus = "idle" | "ready" | "running" | "completed";

export interface TypingMetrics {
	progress: number;
	accuracy: number;
	correctCharCount: number;
	incorrectCharCount: number;
	remainingCharacters: number;
	typedLength: number;
	elapsedMs: number;
	wpm: number;
}

export interface TypingResult extends TypingMetrics {
	durationMs: number;
}

export interface CharacterState {
	character: string;
	state: "untyped" | "correct" | "incorrect";
	index: number;
}

export interface TestResult {
	wpm: number;
	accuracy: number;
	difficulty: Difficulty;
	mode: Mode;
	passageID: string;
	completedAt: string;
	durationMs: number;
}

export interface UserStatistics {
	totalTests: number;
	bestWPM: number;
	bestAccuracy: number;
	averageWPM: number;
	averageAccuracy: number;
	recentTests: TestResult[];
	lastUpdated: string;
}
