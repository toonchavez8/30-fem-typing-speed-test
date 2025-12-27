"use client";

import { useEffect, useState } from "react";
import type { Passage } from "@/lib/types";
import { useGame } from "./GameContext";

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
	return res.json();
}

interface TextcontainterProps {
	difficulty?: string; // normalized to lowercase before use
}

const Textcontainter: React.FC<TextcontainterProps> = ({ difficulty }) => {
	const game = useGame();
	const [passage, setPassage] = useState<Passage | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		async function load() {
			setLoading(true);
			setError(null);

			// Normalize difficulty to lowercase for the API. Prefer context difficulty.
			const diff = String(
				difficulty ?? game.difficulty ?? "hard",
			).toLowerCase();

			// Try the action endpoint first (server action wrapper)
			const actionUrl = `/api/passages/action?difficulty=${encodeURIComponent(
				diff,
			)}`;
			const restUrl = `/api/passages?difficulty=${encodeURIComponent(diff)}`;

			try {
				const data = await fetchJson<Passage>(actionUrl);
				if (mounted) setPassage(data);
			} catch (error_) {
				console.warn("Action endpoint failed, trying REST API:", error_);
				// fallback to REST API
				try {
					const data = await fetchJson<Passage>(restUrl);
					if (mounted) setPassage(data);
				} catch (error_) {
					if (mounted)
						setError((error_ as Error).message || "Failed to load passage");
				}
			} finally {
				if (mounted) setLoading(false);
			}
		}

		load();

		return () => {
			mounted = false;
		};
	}, [difficulty, game.difficulty]);

	if (loading) {
		return (
			<article className="prose max-w-none text-gray-200">
				<p className="text-sm text-gray-400">Loading passage…</p>
			</article>
		);
	}

	if (error) {
		return (
			<article className="prose max-w-none text-gray-200">
				<p className="text-sm text-red-400">Error: {error}</p>
			</article>
		);
	}

	if (!passage) {
		return (
			<article className="prose max-w-none text-gray-200">
				<p className="text-sm text-gray-400">No passage available.</p>
			</article>
		);
	}

	return (
		<article className="prose max-w-none text-gray-200">
			<section aria-labelledby="passage-title">
				<h3 id="passage-title" className="sr-only">
					Passage
				</h3>
				<p className="leading-relaxed font-medium text-2xl xs:text-3xl md:text-[40px]">
					{passage.text}
				</p>
			</section>
		</article>
	);
};

export default Textcontainter;
