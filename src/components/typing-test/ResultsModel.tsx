"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import {
  ModalTextConfig,
  ResultsModalProps,
  testResultType,
  UserStatistics,
} from "@/lib/types";
import { useGame } from "../GameContext";
import { twMerge } from "tailwind-merge";

const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  visualFeedback = true,
}) => {
  const game = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
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

  // add effect to block escape key if modal is open and optionally provide visual feedback
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    // When modal opens, add inert to main content
    const mainContent = document.querySelector("main");
    if (mainContent) mainContent.setAttribute("inert", "");

    let isAnimating = false;
    const listenerOptions = { capture: true as const };

    const handleKeydown = (event: KeyboardEvent) => {
      // block escape key
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();

        // Debounce animations so repeated Esc presses don't stack.
        if (visualFeedback && modalRef.current && !isAnimating) {
          isAnimating = true;
          const el = modalRef.current;
          const shake = gsap.timeline({
            onComplete: () => {
              isAnimating = false;
              // clear transform after animation
              gsap.set(el, { clearProps: "x" });
            },
          });

          // small shake sequence
          shake
            .to(el, { x: -8, duration: 0.04, ease: "power1.inOut" })
            .to(el, { x: 8, duration: 0.08, ease: "power1.inOut" })
            .to(el, { x: -6, duration: 0.06, ease: "power1.inOut" })
            .to(el, { x: 6, duration: 0.06, ease: "power1.inOut" })
            .to(el, { x: 0, duration: 0.05, ease: "power1.inOut" });
        }

        return;
      }
    };

    window.history.pushState({ modal: "results" }, "");

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.modal !== "results") {
        window.history.pushState({ modal: "results" }, "");
      }
    };

    window.addEventListener("keydown", handleKeydown, listenerOptions);

    window.addEventListener("popstate", handlePopState);

    return () => {
      if (mainContent) mainContent.removeAttribute("inert");

      window.removeEventListener("keydown", handleKeydown, listenerOptions);

      window.removeEventListener("popstate", handlePopState);

      if (window.history.state?.modal === "results") {
        window.history.back();
      }
    };
  }, [isOpen, visualFeedback]);

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

  function deriveTestRestultType(
    currentWPM: number,
    statistics: UserStatistics,
  ): testResultType {
    // first test ever(baseline)
    const isFirstTest =
      statistics.totalTests === 0 ||
      (statistics.totalTests === 1 && statistics.bestWPM === currentWPM);

    if (isFirstTest) return "baseline";

    const isNewBest = currentWPM > statistics.bestWPM;

    if (isNewBest) return "new-best";

    return "normal";
  }

  const getmodalTextConfig = (resultType: testResultType): ModalTextConfig => {
    const configs: Record<testResultType, ModalTextConfig> = {
      baseline: {
        heading: "Baseline Established",
        subheading:
          "You've set the bar. Now the real challenge begins—time to beat it.",
        image: "",
      },
      "new-best": {
        heading: "High Score Smashed!",
        subheading: "You're getting faster. That was incredible typing.",
        image: "",
      },
      normal: {
        heading: "Test Complete!",
        subheading: "Solid run. Keep pushing to beat your high score.",
        image: "",
      },
    };
    return configs[resultType];
  };

  const resultType = deriveTestRestultType(game.wpm, game.statistics);
  const textConfig = getmodalTextConfig(resultType);

  return (
    <div
      ref={containerRef}
      className=" inset-0 z-50 flex items-center justify-center bg-FemNeutral-900"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-FemNeutral-900"
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md mx-4 p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl animated-element"
        style={{ opacity: 0, transform: "scale(0.9) translateY(20px)" }}
      >
        <h2 className="text-2xl font-bold text-FemBlue-400 mb-6 text-center">
          {textConfig.heading}
        </h2>

        <p
          className={twMerge(
            "text-center mb-4 font-semibold",

            resultType === "new-best"
              ? "text-emerald-400"
              : resultType === "baseline"
                ? "text-FemBlue-400"
                : "text-FemNeutral-400",
          )}
        >
          {textConfig.subheading}
        </p>

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
