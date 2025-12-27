"use client";

import { useGame } from "../GameContext";
import CharacterSpan from "./CharacterSpan";

const PassageDisplay: React.FC = () => {
	const game = useGame();

	if (!game.passage) return null;

	const characters = game.passage.text.split("");

	return (
		<div className="w-full p-6 bg-gray-900 rounded-lg border border-gray-700">
			<div className="text-2xl md:text-3xl leading-relaxed font-medium">
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
		</div>
	);
};

export default PassageDisplay;
