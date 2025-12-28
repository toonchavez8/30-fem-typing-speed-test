export function calculateWPM(
	correctCharCount: number,
	elapsedMs: number,
): number {
	if (elapsedMs === 0) return 0;

	const minutes = elapsedMs / 60000;
	const words = correctCharCount / 5;
	const wpm = words / minutes;

	return Math.round(Math.max(0, wpm));
}

// calculatre accurase percentage

export function calculateAccuracy(
	correctCount: number,
	incorrectCount: number,
): number {
	const total = correctCount + incorrectCount;
	if (total === 0) return 100;

	const accuracy = (correctCount / total) * 100;

	return Math.round(Math.max(0, Math.min(100, accuracy)));
}

// formate ms to "M:SS" format for better readability

export function formatTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
