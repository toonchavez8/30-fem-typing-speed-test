import StatsContainter from "@/components/statsContainter";
import Textcontainter from "@/components/textcontainter";
import { GameProvider } from "@/components/GameContext";

export default function Home() {
	return (
		<GameProvider>
			<main className="flex flex-col items-center justify-start mt-16 p4 md:px-16  debug">
				<StatsContainter />
				<Textcontainter />
			</main>
		</GameProvider>
	);
}
