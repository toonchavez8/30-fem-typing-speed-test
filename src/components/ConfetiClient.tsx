"use client";

import { useEffect, useState } from "react";
import { useGame } from "./GameContext";
import Confetti from "./typing-test/Confetti";

const ConfettiClient = () => {
	const [showConfetti, setShowConfetti] = useState(false);
	const game = useGame();
	useEffect(() => {
		if (game.testStatus === "completed") {
			setShowConfetti(true);

			// stop confetti after 3 seconds
			const timer = setTimeout(() => {
				setShowConfetti(false);
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [game.testStatus]);

	return <Confetti isActive={showConfetti} duration={3000} />;
};

export default ConfettiClient;
