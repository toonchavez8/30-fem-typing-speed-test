"use client";
import { useRef } from "react";
import { useGame } from "./GameContext";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

type Mode = "timed" | "passage";
type Difficulty = "easy" | "medium" | "hard";

interface StatsContainterProps {
	title?: string;
	wpm?: number;
	accuracy?: number; // percent 0-100
	time?: string; // formatted time e.g. "0:60"
	difficulty?: Difficulty;
	mode?: Mode;
	onDifficultyChange?: (d: Difficulty) => void;
	onModeChange?: (m: Mode) => void;
}

const pillClass = "px-2 py-1 rounded text-sm font-medium border";

interface ToggleButtonProps<T extends string> {
	label: T;
	active: boolean;
	onClick?: (label: T) => void;
}

function ToggleButton<T extends string>({
	label,
	active,
	onClick,
}: Readonly<ToggleButtonProps<T>>) {
	const labelStr = String(label);
	const display = labelStr.charAt(0).toUpperCase() + labelStr.slice(1);
	return (
		<button
			onClick={() => onClick?.(label)}
			className={`mx-1 ${pillClass} ${
				active
					? "text-FemBlue-400 border-FemBlue-400"
					: "bg-transparent text-gray-200 border-gray-700"
			}`}
			aria-pressed={active}
			type="button"
		>
			{display}
		</button>
	);
}

function getTimeColor(testStatus: string): string {
	if (testStatus === "idle" || testStatus === "ready")
		return " text-femNeutral-000";

	return "text-FemYellow-400";
}

function getAccuracyColor(accuracy: number, testStatus: string): string {
	if (testStatus === "idle" || testStatus === "ready")
		return " text-FemNeutral-000";

	if (accuracy >= 90) return "text-FemGreen-500";
	if (accuracy >= 70) return "text-FemYellow-400";

	return "text-FemRed-500";
}

function getWPMColor(wpm: number, testStatus: string): string {
	if (testStatus === "idle" || testStatus === "ready")
		return " text-FemNeutral-000";

	if (wpm >= 40) return "text-FemGreen-500";
	if (wpm >= 20) return "text-FemYellow-400";

	return "text-FemRed-500";
}

const StatsContainter: React.FC<StatsContainterProps> = ({
	wpm,
	accuracy,
	time,
	difficulty,
	mode,
	onDifficultyChange,
	onModeChange,
}) => {
	const game = useGame();
	const containerRef = useRef<HTMLDivElement>(null);
	const wpmRef = useRef<HTMLElement>(null);
	const accuracyRef = useRef<HTMLElement>(null);
	const timeRef = useRef<HTMLElement>(null);

	//track Previous colors to detech changes
	const prevColorsRef = useRef({
		wpm: "",
		accuracy: "",
		time: "",
	});

	// Prefer props if provided, otherwise use context
	const currentWpm = wpm ?? game.wpm;
	const currentAccuracy = accuracy ?? game.accuracy;
	const currentTime = time ?? game.time;
	const currentDifficulty = (difficulty ?? game.difficulty) as Difficulty;
	const currentMode = (mode ?? game.mode) as Mode;

	//calculate current colores
	const wpmColors = getWPMColor(currentWpm, game.testStatus);
	const accuracyColor = getAccuracyColor(currentAccuracy, game.testStatus);
	const timeColor = getTimeColor(game.testStatus);

	const handleDifficultyChange = (d: Difficulty) => {
		onDifficultyChange?.(d);
		game.setDifficulty(d);
	};

	const handleModeChange = (m: Mode) => {
		onModeChange?.(m);
		game.setMode(m);
	};

	useGSAP(
		() => {
			//animate wpm on color change
			if (
				prevColorsRef.current.wpm !== wpmColors &&
				prevColorsRef.current.wpm !== ""
			) {
				gsap.fromTo(
					wpmRef.current,
					{
						scale: 1.2,
					},
					{
						scale: 1,
						duration: 0.3,
						ease: "back.out( 1.7)",
						force3D: true,
						clearProps: "scale",
					},
				);
			}

			prevColorsRef.current.wpm = wpmColors;

			if (
				prevColorsRef.current.accuracy !== accuracyColor &&
				prevColorsRef.current.accuracy !== ""
			) {
				gsap.fromTo(
					accuracyRef.current,
					{
						scale: 1.2,
					},
					{
						scale: 1,
						duration: 0.3,
						ease: "back.out( 1.7)",
						force3D: true,
						clearProps: "scale",
					},
				);
			}

			prevColorsRef.current.accuracy = accuracyColor;

			if (
				prevColorsRef.current.time !== timeColor &&
				prevColorsRef.current.time !== ""
			) {
				gsap.fromTo(
					accuracyRef.current,
					{
						scale: 1.2,
					},
					{
						scale: 1,
						duration: 0.3,
						ease: "back.out( 1.7)",
						force3D: true,
						clearProps: "scale",
					},
				);
			}
			prevColorsRef.current.time = timeColor;
		},
		{
			scope: containerRef,
			dependencies: [wpmColors, accuracyColor, timeColor],
		},
	);

	return (
		<section className="w-full text-gray-100 border-b border-gray-700 pb-4 ">
			<div className="flex flex-wrap items-center justify-between gap-6">
				<dl className="flex gap-6 text-lg ">
					<div className="flex aligns-center justify-center gap-2.5">
						<dt className="font-medium text-gray-400">WPM:</dt>
						<dd
							ref={wpmRef}
							className={`border-r border-gray-700 pr-4 transition-colors duration-300 ${wpmColors}`}
						>
							{currentWpm}
						</dd>
					</div>

					<div className="flex aligns-center justify-center gap-2.5">
						<dt className="font-medium text-gray-400">Accuracy</dt>
						<dd
							ref={accuracyRef}
							className={`border-r border-gray-700 pr-4 transition-colors duration-300 ${accuracyColor}`}
						>
							{currentAccuracy}%
						</dd>
					</div>

					<div className="flex aligns-center justify-center gap-2.5">
						<dt className="font-medium text-gray-400">Time</dt>
						<dd
							ref={timeRef}
							className={`transition-colors duration-300 ${timeColor}`}
						>
							{currentTime}
						</dd>
					</div>
				</dl>

				<fieldset className="flex items-center">
					<legend className="sr-only">Difficulty</legend>
					<span className="mr-4 text-sm font-medium text-gray-400">
						Difficulty:
					</span>
					<ToggleButton
						label={"easy"}
						active={currentDifficulty === "easy"}
						onClick={(l) => handleDifficultyChange(l as Difficulty)}
					/>
					<ToggleButton
						label={"medium"}
						active={currentDifficulty === "medium"}
						onClick={(l) => handleDifficultyChange(l as Difficulty)}
					/>
					<ToggleButton
						label={"hard"}
						active={currentDifficulty === "hard"}
						onClick={(l) => handleDifficultyChange(l as Difficulty)}
					/>
				</fieldset>

				<fieldset className="flex items-center">
					<legend className="sr-only">Mode</legend>
					<span className="mr-4 text-sm font-medium text-gray-400">Mode:</span>
					<ToggleButton
						label={"timed"}
						active={currentMode === "timed"}
						onClick={(l) => handleModeChange(l as Mode)}
					/>
					<ToggleButton
						label={"passage"}
						active={currentMode === "passage"}
						onClick={(l) => handleModeChange(l as Mode)}
					/>
				</fieldset>
			</div>
		</section>
	);
};

export default StatsContainter;
