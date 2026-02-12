'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
  direction: number;
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function createStars() {
      starsRef.current = Array.from({ length: 200 }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.005 + 0.002,
        direction: Math.random() > 0.5 ? 1 : -1,
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const mx = (mouseRef.current.x / canvas!.width - 0.5) * 10;
      const my = (mouseRef.current.y / canvas!.height - 0.5) * 10;

      for (const star of starsRef.current) {
        // Twinkle
        star.opacity += star.speed * star.direction;
        if (star.opacity >= 1) { star.opacity = 1; star.direction = -1; }
        if (star.opacity <= 0.1) { star.opacity = 0.1; star.direction = 1; }

        const px = star.x + mx * (star.radius / 2);
        const py = star.y + my * (star.radius / 2);

        ctx!.beginPath();
        ctx!.arc(px, py, star.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx!.fill();
      }

      animationId = requestAnimationFrame(draw);
    }

    function handleMouse(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    function handleResize() {
      resize();
      createStars();
    }

    resize();
    createStars();
    draw();

    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
