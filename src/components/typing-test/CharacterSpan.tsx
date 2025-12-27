"use client";

import { CharacterState } from "@/lib/types";

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
		className += "text-emerald-500 ";
	} else if (state === "incorrect") {
		className += "text-red-400 ";
	} else {
		className += "text-gray-400 ";
	}

	// Cursor indicator
	if (isCursor) {
		className += "border-b-2 border-FemBlue-400 ";
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
