"use client";

import { useGame } from "../GameContext";
import CharacterSpan from "./CharacterSpan";

const PassageDisplay: React.FC = () => {
	const game = useGame();

	if (!game.passage) return null;

	const characters = game.passage.text.split("");

	return (
		<div className="text-2xl md:text-3xl leading-relaxed font-medium  w-full">
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
