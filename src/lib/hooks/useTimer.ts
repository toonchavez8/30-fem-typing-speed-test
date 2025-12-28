import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TimerSnapshot, TimerStatus } from "../types";

export interface UseTimerOptions {
	/** Duration in seconds; omit for open-ended timers. */
	duration?: number | null;
	/** Auto-starts the timer once the hook mounts. */
	autoStart?: boolean;
	/** Interval granularity in milliseconds. */
	tickRate?: number;
	onTick?: (elapsedMs: number) => void;
	onComplete?: () => void;
}

export interface UseTimerReturn extends TimerSnapshot {
	start: () => void;
	pause: () => void;
	resume: () => void;
	reset: () => void;
	complete: () => void;
}

const DEFAULT_TICK_RATE = 1000;

export const useTimer = (options: UseTimerOptions = {}): UseTimerReturn => {
	const {
		duration = null,
		autoStart = false,
		tickRate = DEFAULT_TICK_RATE,
		onTick,
		onComplete,
	} = options;

	const durationMs =
		typeof duration === "number" && duration > 0 ? duration * 1000 : null;

	const [status, setStatus] = useState<TimerStatus>("idle");
	const [elapsedMs, setElapsedMs] = useState(0);

	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const startTimestampRef = useRef<number | null>(null);
	const pausedAccumulatedRef = useRef(0);

	const clearTimer = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	const getElapsed = useCallback(() => {
		if (startTimestampRef.current === null) {
			return pausedAccumulatedRef.current;
		}

		return (
			pausedAccumulatedRef.current + (Date.now() - startTimestampRef.current)
		);
	}, []);

	const handleCompletion = useCallback(
		(finalElapsed?: number) => {
			clearTimer();
			startTimestampRef.current = null;
			const resolvedElapsed =
				typeof finalElapsed === "number"
					? finalElapsed
					: (durationMs ?? getElapsed());
			pausedAccumulatedRef.current = resolvedElapsed;
			setElapsedMs(resolvedElapsed);
			setStatus("completed");
			onComplete?.();
		},
		[clearTimer, durationMs, getElapsed, onComplete],
	);

	const runTick = useCallback(() => {
		if (startTimestampRef.current === null) {
			return;
		}

		let nextElapsed = getElapsed();

		if (durationMs !== null && nextElapsed >= durationMs) {
			nextElapsed = durationMs;
		}

		setElapsedMs(nextElapsed);
		onTick?.(nextElapsed);

		if (durationMs !== null && nextElapsed >= durationMs) {
			handleCompletion(nextElapsed);
		}
	}, [durationMs, getElapsed, handleCompletion, onTick]);

	const startInterval = useCallback(() => {
		clearTimer();
		intervalRef.current = setInterval(runTick, tickRate);
	}, [clearTimer, runTick, tickRate]);

	const start = useCallback(() => {
		pausedAccumulatedRef.current = 0;
		startTimestampRef.current = Date.now();
		setElapsedMs(0);
		setStatus("running");
		startInterval();
	}, [startInterval]);

	const pause = useCallback(() => {
		if (status !== "running") {
			return;
		}

		const nextElapsed = getElapsed();
		pausedAccumulatedRef.current = nextElapsed;
		setElapsedMs(nextElapsed);
		onTick?.(nextElapsed);
		startTimestampRef.current = null;
		clearTimer();
		setStatus("paused");
	}, [clearTimer, getElapsed, onTick, status]);

	const resume = useCallback(() => {
		if (status !== "paused") {
			return;
		}

		startTimestampRef.current = Date.now();
		setStatus("running");
		startInterval();
	}, [startInterval, status]);

	const reset = useCallback(() => {
		clearTimer();
		startTimestampRef.current = null;
		pausedAccumulatedRef.current = 0;
		setElapsedMs(0);
		setStatus("idle");
	}, [clearTimer]);

	const complete = useCallback(() => {
		if (status === "completed") {
			return;
		}

		const totalElapsed = getElapsed();
		handleCompletion(totalElapsed);
	}, [getElapsed, handleCompletion, status]);

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

	useEffect(() => {
		reset();
	}, [reset]);

	const remainingMs = useMemo(() => {
		if (durationMs === null) {
			return null;
		}

		return Math.max(durationMs - elapsedMs, 0);
	}, [durationMs, elapsedMs]);

	const snapshot: TimerSnapshot = useMemo(() => {
		return {
			status,
			elapsedMs,
			remainingMs,
			elapsedSeconds: elapsedMs / 1000,
			remainingSeconds: remainingMs === null ? null : remainingMs / 1000,
			progress:
				durationMs === null ? null : Math.min(elapsedMs / durationMs, 1),
		};
	}, [durationMs, elapsedMs, remainingMs, status]);

	return {
		...snapshot,
		start,
		pause,
		resume,
		reset,
		complete,
	};
};
