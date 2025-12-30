"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef, useState } from "react";
import { useGame } from "../GameContext";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ isOpen, onClose }) => {
  const game = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const timelineRef = useRef<gsap.core.Timeline>(null);

  // Handle render state when isOpen changes
  useGSAP(
    () => {
      if (isOpen && !shouldRender) {
        setShouldRender(true);
      }
    },
    { dependencies: [isOpen] },
  );

  // GSAP-Master recommended: useGSAP with timeline for sequenced modal animations
  useGSAP(
    () => {
      if (!shouldRender || !backdropRef.current || !modalRef.current) return;

      const timeline = gsap.timeline({ paused: true });

      timeline
        .fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.7, ease: "power2.out", force3D: true },
        )
        .fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.9, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.4,
            ease: "back.out(1.7)",
            force3D: true,
            clearProps: "scale,y",
          },
          "-=0.15",
        );
      timelineRef.current = timeline;

      if (isOpen) {
        timeline.play();
      }

      return () => {
        timeline.kill();
      };
    },
    {
      scope: containerRef,
      dependencies: [shouldRender, isOpen],
    },
  );

  const handleClose = () => {
    const backDrop = backdropRef.current;
    const modal = modalRef.current;

    if (!backDrop || !modal) {
      onClose();
      return;
    }

    const exitTimeline = gsap.timeline({
      onComplete: () => {
        setShouldRender(false);
        onClose();
      },
    });

    exitTimeline
      .to(modalRef.current, {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.25,
        ease: "power2.in",
        force3D: true,
      })
      .to(
        backdropRef.current,
        {
          opacity: 0,
          duration: 0.25,
          ease: "power2.in",
          force3D: true,
        },
        "-=0.2",
      );
  };

  if (!shouldRender) return null;

  const isNewBest = game.wpm > (game.statistics.bestWPM || 0);

  return (
    <div
      ref={containerRef}
      className=" inset-0 z-50 flex items-center justify-center bg-FemNeutral-900"
    >
      {/* Backdrop */}
      <button
        ref={backdropRef}
        className="absolute inset-0 bg-FemNeutral-900"
        onClick={handleClose}
        type="button"
        aria-label="Close modal"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md mx-4 p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl animated-element"
        style={{ opacity: 0, transform: "scale(0.9) translateY(20px)" }}
      >
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
              handleClose();
            }}
            className="flex-1 px-6 py-3 bg-FemBlue-400 hover:bg-FemBlue-500 text-black font-semibold rounded-lg transition"
            type="button"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              game.fetchNewPassage();
              handleClose();
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
