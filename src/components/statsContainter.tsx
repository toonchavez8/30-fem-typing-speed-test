"use client";

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

import { useGame } from "./GameContext";

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

	// Prefer props if provided, otherwise use context
	const currentWpm = wpm ?? game.wpm;
	const currentAccuracy = accuracy ?? game.accuracy;
	const currentTime = time ?? game.time;
	const currentDifficulty = (difficulty ?? game.difficulty) as Difficulty;
	const currentMode = (mode ?? game.mode) as Mode;

	const handleDifficultyChange = (d: Difficulty) => {
		onDifficultyChange?.(d);
		game.setDifficulty(d);
	};

	const handleModeChange = (m: Mode) => {
		onModeChange?.(m);
		game.setMode(m);
	};
	return (
		<section className="w-full text-gray-100 border-b border-gray-700 pb-4 ">
			<div className="flex flex-wrap items-center justify-between gap-6">
				<dl className="flex gap-6 text-lg ">
					<div className="flex aligns-center justify-center gap-2.5">
						<dt className="font-medium text-gray-400">WPM:</dt>
						<dd className=" border-r border-gray-700 pr-4">{currentWpm}</dd>
					</div>

					<div className="flex aligns-center justify-center gap-2.5">
						<dt className="font-medium text-gray-400">Accuracy</dt>
						<dd className="border-r border-gray-700 pr-4">
							{currentAccuracy}%
						</dd>
					</div>

					<div className="flex aligns-center justify-center gap-2.5">
						<dt className="font-medium text-gray-400">Time</dt>
						<dd className="">{currentTime}</dd>
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
