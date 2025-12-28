"use client";

import { useGame } from "@/components/GameContext";
import PassageDisplay from "./PassageDisplay";
import TypingInput from "./TypingInput";

const TypingTestContainer: React.FC = () => {
	const game = useGame();

	// Loading state
	if (!game.passage) {
		return (
			<div className="w-full  mx-auto mt-8 text-pretty">
				<p className="text-gray-400 text-center">Loading passage...</p>
			</div>
		);
	}

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

	// Running state
	if (game.testStatus === "running") {
		return (
			<div className="w-full  mx-auto mt-8 text-pretty">
				<div className="relative">
					<PassageDisplay />
					<TypingInput />
				</div>
			</div>
		);
	}

	// Completed state
	if (game.testStatus === "completed") {
		const isNewBest = game.wpm > game.statistics.bestWPM;

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
									{game.statistics.bestWPM}
								</p>
							</div>
							<div>
								<p className="text-gray-500">Average WPM</p>
								<p className="text-gray-200 font-semibold">
									{game.statistics.averageWPM}
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
						Shortcuts:{" "}
						<kbd className="px-2 py-1 bg-gray-700 rounded">Ctrl+R</kbd> Reset
						<kbd className="px-2 py-1 bg-gray-700 rounded ml-2">Ctrl+N</kbd> New
						Passage
					</p>
				</div>
			</div>
		);
	}

	return null;
};

export default TypingTestContainer;
