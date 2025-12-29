"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { useGame } from "../GameContext";
import CharacterSpan from "./CharacterSpan";

gsap.registerPlugin(useGSAP);

const PassageDisplay: React.FC = () => {
	const game = useGame();
	const containerRef = useRef<HTMLDivElement>(null);
	const highAccuracyStartRef = useRef<number | null>(null);
	const prevTypedLengthRef = useRef(0);

	useGSAP(
		() => {
			const currentLength = game.typedValue.length;
			const hasTypedNewChar = currentLength > prevTypedLengthRef.current;

			prevTypedLengthRef.current = currentLength;

			// Reset tracking when test resets
			if (game.testStatus === "ready" || game.testStatus === "idle") {
				highAccuracyStartRef.current = null;
				prevTypedLengthRef.current = 0;
				return; // Exit early, no animation needed
			}

			const ACCURACY_THRESHOLD = 90;
			const DURATION_THRESHOLD = 5;
			const LENGTH_THRESHOLD = 20;

			// Track when accuracy threshold is met (starts the timer)
			if (
				game.accuracy >= ACCURACY_THRESHOLD &&
				game.testStatus === "running"
			) {
				highAccuracyStartRef.current ??= Date.now();
			} else {
				highAccuracyStartRef.current = null;
			}

			if (!hasTypedNewChar || !containerRef.current) return;

			const highAccuracyDuration = highAccuracyStartRef.current
				? (Date.now() - highAccuracyStartRef.current) / 1000
				: 0;

			if (
				game.accuracy >= ACCURACY_THRESHOLD &&
				highAccuracyDuration > DURATION_THRESHOLD &&
				currentLength > LENGTH_THRESHOLD
			) {
				// GSAP-OPTIMIZED: Micro-shake with GPU acceleration
				gsap.fromTo(
					containerRef.current,
					{ x: -2 },
					{
						x: 0,
						duration: 0.3,
						ease: "elastic.out(1, 0.3)",
						overwrite: true, // Kill any existing animations
						force3D: true, // ADDED: GPU acceleration
						clearProps: "x", // ADDED: Clean up after animation
					},
				);
			}
		},
		{
			scope: containerRef,
			dependencies: [game.typedValue, game.accuracy, game.testStatus],
		},
	);

	if (!game.passage) return null;

	const characters = game.passage.text.split("");

	return (
		<div
			ref={containerRef}
			className="text-2xl md:text-3xl leading-relaxed font-medium w-full animated-element"
		>
			{characters.map((char, index) => {
				const charState = game.characterStates[index];
				const isCursor = index === game.cursorIndex;

				return (
					<CharacterSpan
						key={`${index}-${char}`}
						character={char}
						state={charState?.state || "untyped"}
						isCursor={isCursor}
						index={index}
					/>
				);
			})}
		</div>
	);
};

export default PassageDisplay;
