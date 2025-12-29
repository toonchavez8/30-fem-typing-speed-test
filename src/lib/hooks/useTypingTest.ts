import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { TypingMetrics, TypingResult, TypingTestStatus } from "../types";

const NORMALIZATION_MAP: Record<string, string> = {
	"\u2018": "'",
	"\u2019": "'",
	"\u201C": '"',
	"\u201D": '"',
	"\u2014": "-",
	"\u2013": "-",
};

const normalizeValue = (value: string) =>
	value
		.split("")
		.map((char) => NORMALIZATION_MAP[char] ?? char)
		.join("");

type TypingTestAction =
	| { type: "RESET"; nextStatus: TypingTestStatus }
	| {
			type: "UPDATE_TYPED";
			value: string;
			status: TypingTestStatus;
			isComplete: boolean;
	  };

interface TypingTestState {
	typedValue: string;
	startedAt: number | null;
	completedAt: number | null;
	status: TypingTestStatus;
}

const initialState: TypingTestState = {
	typedValue: "",
	startedAt: null,
	completedAt: null,
	status: "idle",
};

const reducer = (
	state: TypingTestState,
	action: TypingTestAction,
): TypingTestState => {
	switch (action.type) {
		case "RESET":
			return {
				...initialState,
				status: action.nextStatus,
			};
		case "UPDATE_TYPED":
			return {
				typedValue: action.value,
				startedAt:
					state.startedAt ?? (action.value.length > 0 ? Date.now() : null),
				completedAt: action.isComplete ? Date.now() : null,
				status: action.status,
			};
		default:
			return state;
	}
};

export interface UseTypingTestOptions {
	passage: string;
	autoReady?: boolean;
	onComplete?: (result: TypingResult) => void;
}

export interface UseTypingTestReturn {
	status: TypingTestStatus;
	typedValue: string;
	cursorIndex: number;
	isComplete: boolean;
	metrics: TypingMetrics;
	handleInput: (nextValue: string) => void;
	reset: () => void;
}

export const useTypingTest = (
	options: UseTypingTestOptions,
): UseTypingTestReturn => {
	const { passage, autoReady = true, onComplete } = options;
	const passageLength = passage.length;
	const readyStatus: TypingTestStatus = autoReady ? "ready" : "idle";

	const [state, dispatch] = useReducer(reducer, {
		...initialState,
		status: readyStatus,
	});

	const reset = useCallback(() => {
		dispatch({ type: "RESET", nextStatus: readyStatus });
	}, [readyStatus]);

	useEffect(() => {
		reset();
	}, [reset]);

	const handleInput = useCallback(
		(nextValue: string) => {
			if (state.status === "completed") {
				return;
			}
			const limitedValue = nextValue.slice(0, passageLength);

			const isComplete =
				limitedValue.length === passageLength && passageLength > 0;

			let nextStatus: TypingTestStatus;
			if (limitedValue.length === 0) {
				nextStatus = readyStatus;
			} else if (isComplete) {
				nextStatus = "completed";
			} else {
				nextStatus = "running";
			}

			dispatch({
				type: "UPDATE_TYPED",
				value: limitedValue,
				status: nextStatus,
				isComplete,
			});
		},
		[passageLength, readyStatus, state.status],
	);

	const normalizedPassage = useMemo(() => normalizeValue(passage), [passage]);
	const normalizedTyped = useMemo(
		() => normalizeValue(state.typedValue),
		[state.typedValue],
	);

	const metrics = useMemo<TypingMetrics>(() => {
		const targetChars = normalizedPassage.split("");
		const typedChars = normalizedTyped.split("");

		let correctCharCount = 0;
		for (let index = 0; index < typedChars.length; index += 1) {
			if (typedChars[index] === targetChars[index]) {
				correctCharCount += 1;
			}
		}

		const incorrectCharCount = typedChars.length - correctCharCount;
		const remainingCharacters = Math.max(
			targetChars.length - typedChars.length,
			0,
		);
		const progress =
			targetChars.length === 0 ? 0 : typedChars.length / targetChars.length;
		const accuracy =
			typedChars.length === 0 ? 1 : correctCharCount / typedChars.length;

		const startedAt = state.startedAt;
		const completedAt = state.completedAt;
		const elapsedMs = startedAt ? (completedAt ?? Date.now()) - startedAt : 0;

		const minutes = elapsedMs > 0 ? elapsedMs / 60000 : 0;
		const wpm = minutes === 0 ? 0 : correctCharCount / 5 / minutes;

		return {
			progress,
			accuracy,
			correctCharCount,
			incorrectCharCount,
			remainingCharacters,
			typedLength: typedChars.length,
			elapsedMs,
			wpm,
		};
	}, [normalizedPassage, normalizedTyped, state.completedAt, state.startedAt]);

	useEffect(() => {
		if (
			state.status !== "completed" ||
			!state.startedAt ||
			!state.completedAt
		) {
			return;
		}

		onComplete?.({
			...metrics,
			durationMs: state.completedAt - state.startedAt,
		});
	}, [metrics, onComplete, state.completedAt, state.startedAt, state.status]);

	return {
		status: state.status,
		typedValue: state.typedValue,
		cursorIndex: state.typedValue.length,
		isComplete: state.status === "completed",
		metrics,
		handleInput,
		reset,
	};
};
