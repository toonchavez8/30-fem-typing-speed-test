"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";
import { useGame } from "../GameContext";

const StartOverlay: React.FC = () => {
	const game = useGame();
	const overlayRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const textRef = useRef<HTMLParagraphElement>(null);
	const isVisible = game.testStatus === "ready" || game.testStatus === "idle";

	useGSAP(
		() => {
			if (!overlayRef.current) return;

			//create a gsap timeline
			const gsapTimeline = gsap.timeline();

			if (isVisible) {
				gsap.set(overlayRef.current, { display: "flex" });

				//fade in
				gsapTimeline
					.to(overlayRef.current, {
						opacity: 1,
						duration: 0.3,
						ease: "power2.out",
						display: "flex",
						force3D: true,
					})
					.from(
						overlayRef.current,
						{
							y: 10,
							opacity: 0,
							duration: 0.3,
							ease: "back.out(1.7)",
							force3D: true,
							clearProps: "y",
						},
						"-=0.15",
					)
					.from(textRef.current, {
						y: 5,
						opacity: 0,
						duration: 0.2,
						ease: "power2.out",
						force3D: true,
						clearProps: "y",
					});
			} else {
				//fade out
				gsapTimeline.to(overlayRef.current, {
					opacity: 0,
					duration: 0.3,
					ease: "power2.in",
					force3D: true,
					oneComplete: () => {
						if (overlayRef.current) {
							gsap.set(overlayRef.current, { display: "none" });
						}
					},
				});
			}

			return () => {
				gsapTimeline.kill();
			};
		},
		{ scope: overlayRef, dependencies: [isVisible] },
	);

	const handleStartClick = () => {
		// focus the hidden input to start typeing
		const input = document.querySelector(
			'input[aria-label="Typing input"]',
		) as HTMLInputElement;
		input?.focus;
	};
	return (
		<div
			ref={overlayRef}
			className="absolute w-full h-full inset-0 z-20 flex flex-col itemes-center justify-center bg-FemNeutral-900/10 backdrop-blur-sm  "
			style={{
				opacity: isVisible ? 1 : 0,
				display: isVisible ? "flex" : "none",
			}}
		>
			<div className=" w-full h-full flex flex-col justify-center-safe items-center-safe gap-4">
				<button
					ref={buttonRef}
					onClick={handleStartClick}
					type="button"
					className="px-8 py-4 bg-FemBlue-600 hover:bg-FemBlue-400 text-FemNeutral-000 text-xl font-semibold rounded-xl transition-colors   "
				>
					Start typing test
				</button>
				<p ref={textRef} className="text-FemNeutral-400 text-sm">
					or click the text and start typing
				</p>
			</div>
		</div>
	);
};

export default StartOverlay;
