"use client";

import { createContext, useContext, useState } from "react";

type Mode = "timed" | "passage";
type Difficulty = "easy" | "medium" | "hard";

interface GameState {
	difficulty: Difficulty;
	mode: Mode;
	wpm: number;
	accuracy: number;
	time: string;
	setDifficulty: (d: Difficulty) => void;
	setMode: (m: Mode) => void;
	setWpm: (v: number) => void;
	setAccuracy: (v: number) => void;
	setTime: (t: string) => void;
}

const defaultState: GameState = {
	difficulty: "easy",
	mode: "timed",
	wpm: 0,
	accuracy: 100,
	time: "0:60",
	// placeholders
	setDifficulty: () => {},
	setMode: () => {},
	setWpm: () => {},
	setAccuracy: () => {},
	setTime: () => {},
};

const GameContext = createContext<GameState>(defaultState);

export const GameProvider: React.FC<React.PropsWithChildren<unknown>> = ({
	children,
}) => {
	const [difficulty, setDifficulty] = useState<GameState["difficulty"]>(
		defaultState.difficulty,
	);
	const [mode, setMode] = useState<GameState["mode"]>(defaultState.mode);
	const [wpm, setWpm] = useState<number>(defaultState.wpm);
	const [accuracy, setAccuracy] = useState<number>(defaultState.accuracy);
	const [time, setTime] = useState<string>(defaultState.time);

	const value: GameState = {
		difficulty,
		mode,
		wpm,
		accuracy,
		time,
		setDifficulty: (d) => setDifficulty(d),
		setMode: (m) => setMode(m),
		setWpm: (v) => setWpm(v),
		setAccuracy: (v) => setAccuracy(v),
		setTime: (t) => setTime(t),
	};

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame() {
	return useContext(GameContext);
}

export default GameContext;
