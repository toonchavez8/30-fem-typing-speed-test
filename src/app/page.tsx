import StatsContainter from "@/components/statsContainter";
import TypingTestContainer from "@/components/typing-test/TypingTestContainter";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-start mt-16 p4 md:px-16  ">
      <StatsContainter />
      <TypingTestContainer />
    </main>
  );
}
