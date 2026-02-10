'use client';

import { useEffect, useRef } from 'react';

/**
 * AnimatedBackground Component
 *
 * Provides subtle animated background effects for neon cyberpunk theme:
 * - Ambient mesh gradient (CSS-based)
 * - Grid pattern overlay (CSS-based)
 * - Floating particles (Canvas-based)
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      hue: number;
    }

    const particles: Particle[] = [];
    const particleCount = 8;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 2,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -Math.random() * 0.5 - 0.2,
        opacity: Math.random() * 0.15 + 0.05,
        hue: Math.random() * 20 + 180, // Cyan to blue range
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Reset particle if it goes off screen
        if (particle.y < -10) {
          particle.y = canvas.height + 10;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x < -10 || particle.x > canvas.width + 10) {
          particle.x = Math.random() * canvas.width;
        }

        // Draw particle with glow effect
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 2
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 70%, ${particle.opacity})`);
        gradient.addColorStop(0.5, `hsla(${particle.hue}, 100%, 60%, ${particle.opacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      {/* Ambient Gradient Background */}
      <div className="ambient-bg" />

      {/* Grid Pattern Overlay */}
      <div className="grid-pattern" />

      {/* Floating Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[-1]"
        style={{ opacity: 0.6 }}
      />
    </>
  );
}
