import StatsContainter from "@/components/statsContainter";
import Textcontainter from "@/components/textcontainter";

export default function Home() {
	return (
		<main className="flex items-center justify-center ">
			<StatsContainter tittle="StatsContainter" />
			<Textcontainter tittle="StatsContainter" />
		</main>
	);
}
