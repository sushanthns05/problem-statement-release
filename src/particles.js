/**
 * Canvas Particle System
 * Renders drifting, twinkling colored dots (cyan, green, yellow, pink).
 * Performant, capped particle count, automatically respects prefers-reduced-motion.
 */

const COLORS = [
  { r: 63, g: 216, b: 255 },  // Cyan
  { r: 34, g: 224, b: 122 },  // Green
  { r: 255, g: 210, b: 63 },  // Yellow/Gold
  { r: 255, g: 107, b: 181 }, // Pink
];

export class ParticleBackground {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.particles = [];
    this.animId = null;
    this.isRunning = false;
    this.width = 0;
    this.height = 0;

    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.handleResize = this.handleResize.bind(this);
    this.animate = this.animate.bind(this);
    this.handleVisibility = this.handleVisibility.bind(this);

    window.addEventListener("resize", this.handleResize);
    document.addEventListener("visibilitychange", this.handleVisibility);

    this.handleResize();
    this.initParticles();
  }

  handleResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Re-adjust particle positions if needed
    if (this.particles.length === 0) {
      this.initParticles();
    }
  }

  initParticles() {
    const isMobile = this.width < 768;
    const count = isMobile ? 35 : 70; // Capped for 60fps performance
    this.particles = [];

    for (let i = 0; i < count; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.4, // Gentle upward drift
        baseAlpha: 0.2 + Math.random() * 0.6,
        alphaPhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        color,
      });
    }
  }

  handleVisibility() {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    if (this.reducedMotion) {
      // Just render a static frame if reduced motion is requested
      this.renderStaticFrame();
      return;
    }
    this.isRunning = true;
    this.animId = requestAnimationFrame(this.animate);
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  renderStaticFrame() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.baseAlpha})`;
      this.ctx.fill();
    }
  }

  animate() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update positions
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around screen
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Twinkle with sine wave
      p.alphaPhase += p.twinkleSpeed;
      const currentAlpha = Math.max(0.1, p.baseAlpha + Math.sin(p.alphaPhase) * 0.3);

      // Render dot with soft glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha})`;
      this.ctx.fill();

      // Soft glow center
      if (p.radius > 1.8) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha * 0.25})`;
        this.ctx.fill();
      }
    }

    this.animId = requestAnimationFrame(this.animate);
  }

  destroy() {
    this.stop();
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }
}

