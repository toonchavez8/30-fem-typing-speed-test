"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/components/GameContext";
import PassageDisplay from "./PassageDisplay";
import ResultsModal from "./ResultsModel";
import TypingInput from "./TypingInput";

const TypingTestContainer: React.FC = () => {
	const game = useGame();
	const [showResultsModal, setShowResultsModal] = useState(false);

	// Show modal when test completes
	useEffect(() => {
		if (game.testStatus === "completed") {
			setShowResultsModal(true);
		}
	}, [game.testStatus]);

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
			<>
				{/* Your existing JSX for different states */}
				<ResultsModal
					isOpen={showResultsModal}
					onClose={() => setShowResultsModal(false)}
				/>
			</>
		);
	}

	return null;
};

export default TypingTestContainer;
