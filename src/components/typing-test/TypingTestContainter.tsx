"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/components/GameContext";
import PassageDisplay from "./PassageDisplay";
import ResultsModal from "./ResultsModel";
import StartOverlay from "./StartOverlay";
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
				<p className="text-gray-400 text-center animated-element animate-pulse">
					Loading passage...
				</p>
			</div>
		);
	}

	// Idle/Ready state - show instructions
	if (game.testStatus === "idle" || game.testStatus === "ready") {
		return (
			<div className="w-full h-full mx-auto mt-8 text-pretty">
				<div className="relative h-full">
					<PassageDisplay />
					<TypingInput />
					<StartOverlay />
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
	return (
		<>
			{/* Relative container for modal positioning - modal only covers this area */}
			<div className="relative w-full mx-auto mt-8 text-pretty min-h-[200px]">
				{/* Passage display area */}
				<div className="relative">
					<PassageDisplay />
				</div>

				{/* Results Modal - positioned absolute within this container */}
				<ResultsModal
					isOpen={showResultsModal}
					onClose={() => setShowResultsModal(false)}
				/>
			</div>
		</>
	);
};

export default TypingTestContainer;
