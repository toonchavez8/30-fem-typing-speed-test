import passageSource from "@/data/data.json";
import type { Difficulty, Passage, PassageBuckets } from "./types";

type RawPassage = { id: string; text: string };
type RawDataset = Record<Difficulty, RawPassage[]>;

const rawDataset = passageSource as RawDataset;

const buildDataset = (): PassageBuckets => {
	const base: PassageBuckets = {
		easy: [],
		medium: [],
		hard: [],
	};

	return (
		Object.entries(rawDataset) as [Difficulty, RawPassage[]][]
	).reduce<PassageBuckets>((acc, [difficulty, passages]) => {
		acc[difficulty] = passages.map((passage) => ({ ...passage, difficulty }));
		return acc;
	}, base);
};

const dataset = buildDataset();
const passageIndex = new Map<string, Passage>();

Object.values(dataset).forEach((bucket) => {
	bucket.forEach((passage) => {
		passageIndex.set(passage.id, passage);
	});
});

const clonePassage = (passage: Passage): Passage => ({ ...passage });

export const getDifficultyList = (): Difficulty[] => ["easy", "medium", "hard"];

export const getPassagesByDifficulty = (difficulty: Difficulty): Passage[] => {
	const bucket = dataset[difficulty];

	if (!bucket || bucket.length === 0) {
		throw new Error(`No passages available for difficulty: ${difficulty}`);
	}

	return bucket.map(clonePassage);
};

export const getPassageById = (passageId: string): Passage | undefined => {
	const passage = passageIndex.get(passageId);
	return passage ? clonePassage(passage) : undefined;
};

export const getRandomPassage = (
	difficulty: Difficulty,
	excludeId?: string,
): Passage => {
	const bucket = dataset[difficulty];

	if (!bucket || bucket.length === 0) {
		throw new Error(`No passages available for difficulty: ${difficulty}`);
	}

	const pool = excludeId
		? bucket.filter((passage) => passage.id !== excludeId)
		: bucket;
	const fallbackPool = pool.length > 0 ? pool : bucket;
	const choice = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];

	return clonePassage(choice);
};

export const getNextPassageId = (
	currentId: string,
	difficulty: Difficulty,
): string => {
	const bucket = dataset[difficulty];

	if (!bucket || bucket.length === 0) {
		throw new Error(`No passages available for difficulty: ${difficulty}`);
	}

	const currentIndex = bucket.findIndex((passage) => passage.id === currentId);
	const nextIndex =
		currentIndex === -1 ? 0 : (currentIndex + 1) % bucket.length;

	return bucket[nextIndex].id;
};

export const getDatasetSnapshot = (): PassageBuckets => {
	return {
		easy: dataset.easy.map(clonePassage),
		medium: dataset.medium.map(clonePassage),
		hard: dataset.hard.map(clonePassage),
	};
};
