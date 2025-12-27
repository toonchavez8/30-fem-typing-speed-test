import { NextResponse } from "next/server";
import { getRandomPassage } from "@/lib/passages";
import type { Difficulty, Passage } from "@/lib/types";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const difficultyParam = (url.searchParams.get("difficulty") ?? "easy").toLowerCase() as Difficulty;
        const excludeId = url.searchParams.get("excludeId") ?? undefined;

        const allowed: Difficulty[] = ["easy", "medium", "hard"];
        if (!allowed.includes(difficultyParam)) {
            return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
        }

        const passage: Passage = getRandomPassage(difficultyParam, excludeId ?? undefined);
        return NextResponse.json(passage);
    } catch (err) {
        console.error("GET /api/passages error:", err);
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
