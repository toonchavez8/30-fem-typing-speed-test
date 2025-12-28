"use client";

import { useGame } from "../GameContext";

interface ResultsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ isOpen, onClose }) => {
	const game = useGame();

	if (!isOpen) return null;

	const isNewBest = game.wpm > (game.statistics.bestWPM || 0);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<button
				className="absolute inset-0 bg-black/70 backdrop-blur-sm"
				onClick={onClose}
				type="button"
			/>

			{/* Modal Content */}
			<div className="relative z-10 w-full max-w-md mx-4 p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl">
				<h2 className="text-2xl font-bold text-FemBlue-400 mb-6 text-center">
					Test Complete! {isNewBest && "🎉"}
				</h2>

				{isNewBest && (
					<p className="text-emerald-400 text-center mb-4 font-semibold">
						New Personal Best!
					</p>
				)}

				{/* Results Grid */}
				<div className="grid grid-cols-3 gap-4 mb-6">
					<div className="text-center p-3 bg-gray-900 rounded-lg">
						<p className="text-gray-400 text-xs uppercase tracking-wide">WPM</p>
						<p className="text-3xl font-bold text-gray-100">{game.wpm}</p>
					</div>
					<div className="text-center p-3 bg-gray-900 rounded-lg">
						<p className="text-gray-400 text-xs uppercase tracking-wide">
							Accuracy
						</p>
						<p className="text-3xl font-bold text-gray-100">{game.accuracy}%</p>
					</div>
					<div className="text-center p-3 bg-gray-900 rounded-lg">
						<p className="text-gray-400 text-xs uppercase tracking-wide">
							Time
						</p>
						<p className="text-3xl font-bold text-gray-100">{game.time}</p>
					</div>
				</div>

				{/* Statistics */}
				<div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
					<h3 className="text-sm font-semibold text-gray-400 mb-3">
						Your Statistics
					</h3>
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<p className="text-gray-500">Total Tests</p>
							<p className="text-gray-200 font-semibold">
								{game.statistics.totalTests}
							</p>
						</div>
						<div>
							<p className="text-gray-500">Best WPM</p>
							<p className="text-emerald-400 font-semibold">
								{game.statistics.bestWPM}
							</p>
						</div>
						<div>
							<p className="text-gray-500">Average WPM</p>
							<p className="text-gray-200 font-semibold">
								{game.statistics.averageWPM}
							</p>
						</div>
						<div>
							<p className="text-gray-500">Best Accuracy</p>
							<p className="text-emerald-400 font-semibold">
								{game.statistics.bestAccuracy}%
							</p>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-3">
					<button
						onClick={() => {
							game.resetTest();
							onClose();
						}}
						className="flex-1 px-6 py-3 bg-FemBlue-400 hover:bg-FemBlue-500 text-black font-semibold rounded-lg transition"
						type="button"
					>
						Try Again
					</button>
					<button
						onClick={() => {
							game.fetchNewPassage();
							onClose();
						}}
						className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg transition"
						type="button"
					>
						New Passage
					</button>
				</div>

				{/* Keyboard Shortcuts */}
				<p className="mt-4 text-xs text-gray-500 text-center">
					Press <kbd className="px-2 py-1 bg-gray-700 rounded">Ctrl+R</kbd> to
					reset or <kbd className="px-2 py-1 bg-gray-700 rounded">Ctrl+N</kbd>{" "}
					for new passage
				</p>
			</div>
		</div>
	);
};

export default ResultsModal;
