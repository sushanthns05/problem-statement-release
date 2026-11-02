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

  playCurtainOpen() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Deep ceremonial swelling chord: Low C3 (130.81Hz) + G3 (196Hz) + C4 (261.63Hz) + E4 (329.63Hz)
    const freqs = [130.81, 196.0, 261.63, 329.63, 523.25];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), this.ctx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 2.6);
    });
  }

  /**
   * Curious Mass Beats Countdown Synthesizer
   * Produces an electrifying South Indian cinema trailer / mass build-up
   * featuring curious syncopated trailer rhythm hits (taps / dhum)
   * followed by an explosive sub-bass 808 drop, dhol / war-drum transient punch,
   * and an escalating suspense tension riser from 5 down to 1.
   */
  playCountdown5to1(count) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Heavy Mass Sub-Bass Drop (808 / Cinematic Boom)
    const playSubBassDrop = (startTime, startFreq, endFreq, peakGain, decaySec) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + decaySec);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + decaySec);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + decaySec + 0.05);
    };

    // 2. Punchy War Drum / Dhol transient impact (Mass Kick)
    const playDrumImpact = (startTime, pitch, peakGain) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(pitch, startTime);
      osc.frequency.exponentialRampToValueAtTime(35, startTime + 0.18);

      gain.gain.setValueAtTime(peakGain, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);

      // Noise punch for tactile skin impact
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(450, startTime);
      filter.Q.setValueAtTime(2.5, startTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(peakGain * 0.7, startTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.055);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(startTime);
      noise.stop(startTime + 0.06);
    };

    // 3. Curious Suspense Pre-Beat Tap (syncopated trailer rhythm: tak / dhum)
    const playCuriousTap = (startTime, freq, vol) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, startTime + 0.05);

      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.07);
    };

    // 4. Suspense Tension Drone / Metallic Riser
    const playSuspenseRiser = (startTime, baseFreq, duration, vol) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(baseFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, startTime + duration);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600, startTime);
      filter.frequency.exponentialRampToValueAtTime(1800, startTime + duration);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + duration * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    };

    // Escalating curious mass beat patterns per count:
    switch (count) {
      case 5:
        // Count 5: Curious opening pulse + deep resonant mass strike
        playCuriousTap(t, 420, 0.18);
        playCuriousTap(t + 0.15, 520, 0.22);
        playDrumImpact(t + 0.3, 110, 0.35);
        playSubBassDrop(t + 0.3, 115, 42, 0.38, 0.65);
        playSuspenseRiser(t + 0.3, 220, 0.65, 0.08);
        break;

      case 4:
        // Count 4: Double curiosity syncopation + heavier punch
        playCuriousTap(t, 480, 0.2);
        playCuriousTap(t + 0.12, 600, 0.24);
        playCuriousTap(t + 0.24, 720, 0.26);
        playDrumImpact(t + 0.36, 125, 0.4);
        playSubBassDrop(t + 0.36, 130, 40, 0.42, 0.6);
        playSuspenseRiser(t + 0.36, 277, 0.6, 0.1);
        break;

      case 3:
        // Count 3: Triple curiosity rhythm + deep chest thud
        playCuriousTap(t, 550, 0.22);
        playCuriousTap(t + 0.1, 700, 0.26);
        playCuriousTap(t + 0.2, 850, 0.28);
        playDrumImpact(t + 0.3, 140, 0.45);
        playSubBassDrop(t + 0.3, 150, 38, 0.48, 0.65);
        playSuspenseRiser(t + 0.3, 330, 0.65, 0.12);
        break;

      case 2:
        // Count 2: Rapid driving curious roll + hard war drum hit
        playCuriousTap(t, 620, 0.24);
        playCuriousTap(t + 0.08, 780, 0.26);
        playCuriousTap(t + 0.16, 940, 0.3);
        playCuriousTap(t + 0.24, 1100, 0.32);
        playDrumImpact(t + 0.32, 160, 0.5);
        playSubBassDrop(t + 0.32, 175, 36, 0.52, 0.65);
        playSuspenseRiser(t + 0.32, 440, 0.65, 0.14);
        break;

      case 1:
        // Count 1: Maximum mass trailer climax - ta-ka-dhum into explosive sub-bass
        playCuriousTap(t, 750, 0.28);
        playCuriousTap(t + 0.06, 950, 0.3);
        playCuriousTap(t + 0.12, 1150, 0.34);
        playCuriousTap(t + 0.18, 1400, 0.38);
        // Colossal Mass Impact
        playDrumImpact(t + 0.24, 190, 0.6);
        playSubBassDrop(t + 0.24, 210, 32, 0.6, 0.75);
        playSuspenseRiser(t + 0.24, 554, 0.75, 0.18);
        break;

      default:
        playDrumImpact(t, 120, 0.4);
        playSubBassDrop(t, 120, 40, 0.4, 0.6);
        break;
    }
  }

  playStatementTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Pleasant high-tech chime for problem statement switch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.12); // E6
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export const sound = new SoundEffects();

