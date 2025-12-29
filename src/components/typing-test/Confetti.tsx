import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

const COLORS = [
  "#4ca6ff",
  "#4dd67b",
  "#f4dc73",
  "#d64d5b",
  "#177dff",
  "#ffffff",
];

const Confetti: React.FC<ConfettiProps> = ({ isActive, duration = 3000 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const createParticle = useCallback((canvas: HTMLCanvasElement): Particle => {
    return {
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 3 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    };
  }, []);

  useEffect(() => {
    if (!isActive || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    //set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // inialize particles
    particleRef.current = Array.from({ length: 150 }, () =>
      createParticle(canvas),
    );
    startTimeRef.current = Date.now();

    const Animate = () => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      if (elapsed > duration) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      // add new particles periodically
      if (elapsed < duration * 0.7 && Math.random() > 0.7) {
        particleRef.current.push(createParticle(canvas));
      }

      particleRef.current = particleRef.current.filter((particle) => {
        // update particle position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // gravity
        particle.rotation += particle.rotationSpeed;

        // Draw particle
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate((particle.rotation * Math.PI) / 180);
        context.fillStyle = particle.color;
        context.fillRect(
          -particle.size / 2,
          -particle.size / 2,
          particle.size,
          particle.size * 0.5,
        );
        context.restore();

        //keep Particle if still visible
        return particle.y < canvas.height + 20;
      });

      animationRef.current = requestAnimationFrame(Animate);
    };

    Animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, duration, createParticle]);

  if (!isActive) return null;

  // Render the canvas into document.body so it's outside modal/backdrop stacking contexts
  const canvasElement = (
    <canvas
      ref={canvasRef}
      // pointer-events-none so it doesn't block clicks/focus
      // very high z-index so it sits above modal and backdrop
      className="fixed pointer-events-none z-100  inset-0 h-screen w-screen"
    />
  );

  return typeof document !== "undefined"
    ? createPortal(canvasElement, document.body)
    : null;
};
export default Confetti;
