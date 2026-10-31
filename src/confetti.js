/**
 * Celebratory Confetti Burst
 * Lightweight, zero-dependency burst triggered on release reveal.
 * Respects prefers-reduced-motion.
 */

const CONFETTI_COLORS = [
  "#22e07a", // Neon Green
  "#3fd8ff", // Cyber Cyan
  "#ffd23f", // Gold
  "#ff4f81", // Neon Pink
  "#b066ff", // Electric Purple
  "#ffffff", // Bright White
];

export function launchConfetti(canvasElement, durationMs = 4500) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return; // Respect reduced motion preference
  }

  const canvas = canvasElement;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particles = [];
  const particleCount = 140;

  // Launch from two bottom sides towards center
  for (let i = 0; i < particleCount; i++) {
    const isLeft = i % 2 === 0;
    const startX = isLeft ? window.innerWidth * 0.15 : window.innerWidth * 0.85;
    const startY = window.innerHeight * 0.8;

    const angle = isLeft
      ? -Math.PI / 4 + (Math.random() - 0.5) * 0.6
      : -3 * Math.PI / 4 + (Math.random() - 0.5) * 0.6;

    const speed = 12 + Math.random() * 16;

    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      shape: Math.random() > 0.3 ? "rect" : "circle",
      wobble: Math.random() * 10,
      opacity: 1,
    });
  }

  const startTime = performance.now();
  let animationFrameId;

  function render(now) {
    const elapsed = now - startTime;
    const progress = elapsed / durationMs;

    if (progress >= 1) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Physics
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.vx *= 0.985; // Drag
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - Math.pow(progress, 1.8));

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(render);
  }

  animationFrameId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animationFrameId);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };
}

