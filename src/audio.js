/**
 * Web Audio API Sound Synthesizer
 * Plays high-tech countdown beeps and triumphant ceremonial fanfare
 * with zero external MP3 assets (100% offline & fast).
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playIntroBeep(count) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Frequencies: 3 -> 660Hz, 2 -> 880Hz, 1 -> 1108Hz
    const freqs = { 3: 660, 2: 880, 1: 1108 };
    const freq = freqs[count] || 880;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  playGrandLaunchFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Triumphant orchestral chime: C5, E5, G5, C6 arpeggiated fanfare
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];

    notes.forEach((freq, index) => {
      const startTime = this.ctx.currentTime + index * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.85);
    });
  }

  playRevealChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Harmonious reveal chime: E5 -> A5 -> B5 -> E6
    const freqs = [659.25, 880.0, 987.77, 1318.51];
    freqs.forEach((freq, i) => {
      const t = this.ctx.currentTime + i * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  }

  playThemeTransition() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Crisp high-tech tick: 880Hz to 1200Hz short blip
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export const sound = new SoundEffects();

