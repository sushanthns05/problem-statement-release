/**
 * Spectacular Glitter & Sparkle Celebration Engine
 * Renders shimmering golden glitter, starbursts, and radiant sparkles
 * when the Principal launches the hackathon.
 */

const GLITTER_PALETTE = [
  "#ffd700", // Pure Gold
  "#ffec8b", // Light Gold
  "#fff8dc", // Cornsilk Shimmer
  "#ffffff", // Brilliant White Sparkle
  "#22e07a", // Neon Emerald
  "#3fd8ff", // Cyan Diamond
  "#ff9e00", // Amber Glow
];

export class GlitterEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.animId = null;
    this.isRunning = false;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
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
  }

  /**
   * Launch a massive golden glitter explosion from the center and across the screen
   */
  explodeGlitter(particleCount = 280) {
    const originX = this.width / 2;
    const originY = this.height * 0.45;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 22;
      const color = GLITTER_PALETTE[Math.floor(Math.random() * GLITTER_PALETTE.length)];
      const size = 3 + Math.random() * 7;

      this.particles.push({
        x: originX + (Math.random() - 0.5) * 60,
        y: originY + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        gravity: 0.18 + Math.random() * 0.12,
        friction: 0.965,
        size,
        color,
        opacity: 1,
        life: 0,
        maxLife: 240 + Math.random() * 160,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 15,
        twinkleSpeed: 0.1 + Math.random() * 0.25,
        twinklePhase: Math.random() * Math.PI * 2,
        isStar: Math.random() > 0.45,
      });
    }

    // Add extra shower from the top
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: -10 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 2.5,
        vy: 1.5 + Math.random() * 3.5,
        gravity: 0.05,
        friction: 0.99,
        size: 2.5 + Math.random() * 5,
        color: GLITTER_PALETTE[Math.floor(Math.random() * GLITTER_PALETTE.length)],
        opacity: 1,
        life: 0,
        maxLife: 300 + Math.random() * 100,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        twinkleSpeed: 0.15 + Math.random() * 0.2,
        twinklePhase: Math.random() * Math.PI * 2,
        isStar: Math.random() > 0.3,
      });
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  drawStar(cx, cy, spikes, outerRadius, innerRadius, color, alpha) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }

    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = alpha;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = color;
    this.ctx.fill();
    this.ctx.restore();
  }

  animate() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.rotation += p.rotSpeed;
      p.twinklePhase += p.twinkleSpeed;

      const progress = p.life / p.maxLife;
      const fade = Math.max(0, 1 - progress);
      const twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase);
      const currentAlpha = fade * twinkle;

      if (currentAlpha <= 0.02 || p.y > this.height + 40) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.isStar) {
        this.drawStar(p.x, p.y, 4, p.size, p.size * 0.35, p.color, currentAlpha);
      } else {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = currentAlpha;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        this.ctx.restore();
      }
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.animate());
    } else {
      this.isRunning = false;
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.particles = [];
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  destroy() {
    this.stop();
    window.removeEventListener("resize", this.handleResize);
  }
}
