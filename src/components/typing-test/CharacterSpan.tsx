"use client";

import type { CharacterState } from "@/lib/types";

interface CharacterSpanProps {
	character: string;
	state: CharacterState["state"];
	isCursor: boolean;
	index: number;
}

const CharacterSpan: React.FC<CharacterSpanProps> = ({
	character,
	state,
	isCursor,
}) => {
	// Base classes
	let className = "inline-block relative ";

	// State-based color
	if (state === "correct") {
		className += "text-FemGreen-500 ";
	} else if (state === "incorrect") {
		className += "text-FemRed-500  ";
	} else {
		className += "text-gray-400 ";
	}

	// Cursor indicator
	if (isCursor) {
		className += "rounded bg-FemNeutral-000/20 animate-pulse ";
	}

	// Special character handling
	const displayChar = character === " " ? "\u00A0" : character;

	return (
		<span className={className} data-char={character}>
			{displayChar}
		</span>
	);
};

export default CharacterSpan;
