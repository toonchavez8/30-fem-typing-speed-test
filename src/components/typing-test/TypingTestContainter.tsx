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
		return (
			<div className="w-full  mx-auto mt-8 text-pretty ">
				<PassageDisplay />
				<div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
					<h2 className="text-2xl font-bold text-FemBlue-400 mb-4">
						Test Complete!
					</h2>
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
					<button
						onClick={game.resetTest}
						className="w-full px-6 py-3 bg-FemBlue-400 hover:bg-FemBlue-500 text-black font-semibold rounded transition"
						type="button"
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
