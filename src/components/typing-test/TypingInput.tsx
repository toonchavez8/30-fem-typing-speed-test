"use client";
import { useGame } from "@/components/GameContext";
import { useEffect, useRef } from "react";

const TypingInput: React.FC = () => {
	const game = useGame();
	const inputRef = useRef<HTMLInputElement>(null);

	//AutoFocus when test is ready or running

	useEffect(() => {
		if (game.testStatus === "ready" || game.testStatus === "running") {
			inputRef.current?.focus();
		}
	}, [game.testStatus]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		game.handleTyping(event.target.value);
	};

	const handleBlur = () => {
		// restore focus if test is running
		if (game.testStatus === "running") {
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	};

	if (game.testStatus === "completed") return null;

	return (
		<input
			ref={inputRef}
			type="text"
			value={game.typedValue}
			onChange={handleChange}
			onBlur={handleBlur}
			className="  absolute inset-0 w-full h-full px-6 py-6 bg-transparent text-2xl md:text-3xl leading-relaxed font-medium text-transparent  focus:outline-none cursor-text"
			disabled={game.testStatus === "idle"}
			aria-label="Typing input"
			autoComplete="off"
			autoCorrect="off"
			autoCapitalize="off"
			spellCheck="false"
		/>
	);
};

export default TypingInput;
