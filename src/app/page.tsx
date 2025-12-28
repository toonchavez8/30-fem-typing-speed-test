import { GameProvider } from "@/components/GameContext";
import StatsContainter from "@/components/statsContainter";
import TypingTestContainer from "@/components/typing-test/TypingTestContainter";

export default function Home() {
	return (
		<GameProvider>
			<main className="flex flex-col items-center justify-start mt-16 p4 md:px-16  debug">
				<StatsContainter />
				<TypingTestContainer />
			</main>
		</GameProvider>
	);
}
