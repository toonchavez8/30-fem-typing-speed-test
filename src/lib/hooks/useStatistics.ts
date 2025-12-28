import { useCallback, useEffect, useState } from "react";
import type { TestResult, UserStatistics } from "../types";
import { getLocalStorage, setLocalStorage } from "../utils/storage";

const STATISTICS_KEY = "uster-statistics";
const MAX_RECENT_TESTS = 10;

const DEFAULT_STATISTICS: UserStatistics = {
	totalTests: 0,
	bestWPM: 0,
	bestAccuracy: 0,
	averageWPM: 0,
	averageAccuracy: 0,
	recentTests: [],
	lastUpdated: new Date().toISOString(),
};

export function useStatistics() {
	const [statistics, setStatistics] =
		useState<UserStatistics>(DEFAULT_STATISTICS);
	const [isLoaded, setIsLoaded] = useState(false);

	// load statistics from local storage on mount
	useEffect(() => {
		const stored = getLocalStorage<UserStatistics>(
			STATISTICS_KEY,
			DEFAULT_STATISTICS,
		);
		setStatistics(stored);
		setIsLoaded(true);
	}, []);

	const saveTestResult = useCallback((result: TestResult) => {
		setStatistics((prev) => {
			const newRecentTests = [result, ...prev.recentTests].slice(
				0,
				MAX_RECENT_TESTS,
			);
			const allTests = [result, ...prev.recentTests];
			const count = allTests.length;
			// calculate new avergages
			const totalWPM = allTests.reduce((sum, test) => sum + test.wpm, 0);
			const totalAccuracy = allTests.reduce(
				(sum, test) => sum + test.accuracy,
				0,
			);

			const newStats: UserStatistics = {
				totalTests: prev.totalTests + 1,
				bestWPM: Math.max(prev.bestWPM, result.wpm),
				bestAccuracy: Math.max(prev.bestAccuracy, result.accuracy),
				averageWPM: Math.round(totalWPM / count),
				averageAccuracy: Math.round(totalAccuracy / count),
				recentTests: newRecentTests,
				lastUpdated: new Date().toISOString(),
			};

			setLocalStorage(STATISTICS_KEY, newStats);

			return newStats;
		});
	}, []);
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
