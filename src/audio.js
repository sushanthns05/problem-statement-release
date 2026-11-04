/**
 * Web Audio API Sound Synthesizer
 * Plays high-tech countdown beeps and triumphant ceremonial fanfare
 * with zero external MP3 assets (100% offline & fast).
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmGain = null;
    this.bgmInterval = null;
    this.bgmIsPlaying = false;
    this.bgmAudio = null;
    this.bgmFadeInterval = null;
    this.audioSourceUrl = "/assets/audio.mpeg";

    // Dedicated Countdown BGM
    this.countdownAudio = null;
    this.countdownFadeInterval = null;
    this.countdownIsPlaying = false;
    this.countdownSourceUrl = "/assets/countdown.wav";
    this.countdownSynthGain = null;
    this.countdownSynthInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = typeof window !== "undefined" ? (window.AudioContext || window.webkitAudioContext) : null;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    // Preload audio.mpeg track for the starting part
    if (typeof window !== "undefined" && typeof Audio !== "undefined" && !this.bgmAudio) {
      try {
        this.bgmAudio = new Audio(this.audioSourceUrl);
        this.bgmAudio.loop = true;
        this.bgmAudio.preload = "auto";
        this.bgmAudio.volume = this.muted ? 0 : 0.75;
        this.bgmAudio.addEventListener("error", () => {
          if (this.bgmAudio && this.bgmAudio.src.endsWith(".mpeg")) {
            this.bgmAudio.src = "/assets/audio.mp3";
          }
        }, { once: true });
      } catch (err) {
        console.warn("HTML5 Audio preload warning:", err);
      }
    }
    // Preload countdown music BGM
    if (typeof window !== "undefined" && typeof Audio !== "undefined" && !this.countdownAudio) {
      try {
        this.countdownAudio = new Audio(this.countdownSourceUrl);
        this.countdownAudio.preload = "auto";
        this.countdownAudio.volume = this.muted ? 0 : 0.85;
        this.countdownAudio.addEventListener("error", () => {
          if (this.countdownAudio && this.countdownAudio.src.includes("countdown.mp3")) {
            this.countdownAudio.src = "/assets/audio.mp3";
          }
        }, { once: true });
      } catch (err) {
        console.warn("HTML5 Countdown Audio preload warning:", err);
      }
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
   * Countdown Music BGM (Behind 5 to 1 Countdown)
   * Plays official countdown music audio track behind the 5 to 1 countdown.
   */
  startCountdownBgm() {
    if (this.muted) return;
    this.init();

    if (this.countdownIsPlaying) return;
    this.countdownIsPlaying = true;

    if (this.countdownFadeInterval) {
      clearInterval(this.countdownFadeInterval);
      this.countdownFadeInterval = null;
    }

    const targetVolume = this.muted ? 0 : 0.85;

    // 1. Primary: HTML5 Audio playing countdown music BGM
    if (typeof window !== "undefined" && typeof Audio !== "undefined") {
      try {
        if (!this.countdownAudio) {
          this.countdownAudio = new Audio(this.countdownSourceUrl);
          this.countdownAudio.preload = "auto";
        }

        this.countdownAudio.muted = this.muted;
        this.countdownAudio.volume = targetVolume;
        this.countdownAudio.currentTime = 0;

        const playPromise = this.countdownAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Countdown audio play blocked or failed; falling back to synth countdown music:", err);
            this.startSynthCountdownBgm();
          });
        }
      } catch (err) {
        console.warn("Countdown Audio error, falling back:", err);
        this.startSynthCountdownBgm();
      }
    } else {
      this.startSynthCountdownBgm();
    }
  }

  stopCountdownBgm(fadeSec = 0.8) {
    if (!this.countdownIsPlaying) return;
    this.countdownIsPlaying = false;

    if (this.countdownFadeInterval) {
      clearInterval(this.countdownFadeInterval);
      this.countdownFadeInterval = null;
    }

    this.stopSynthCountdownBgm(fadeSec);

    if (this.countdownAudio) {
      const startVol = this.countdownAudio.volume;
      const steps = 12;
      const stepTime = Math.max(20, (fadeSec * 1000) / steps);
      let stepCount = 0;

      this.countdownFadeInterval = setInterval(() => {
        stepCount++;
        if (!this.countdownAudio) {
          clearInterval(this.countdownFadeInterval);
          this.countdownFadeInterval = null;
          return;
        }
        const newVol = Math.max(0, startVol * (1 - stepCount / steps));
        this.countdownAudio.volume = newVol;

        if (stepCount >= steps || newVol <= 0.01) {
          clearInterval(this.countdownFadeInterval);
          this.countdownFadeInterval = null;
          try {
            this.countdownAudio.pause();
            this.countdownAudio.currentTime = 0;
          } catch {}
        }
      }, stepTime);
    }
  }

  startSynthCountdownBgm() {
    if (!this.ctx) return;
    if (this.countdownSynthGain) return;

    this.countdownSynthGain = this.ctx.createGain();
    const targetVol = this.muted ? 0.0001 : 0.22;
    this.countdownSynthGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.countdownSynthGain.gain.exponentialRampToValueAtTime(targetVol, this.ctx.currentTime + 0.6);
    this.countdownSynthGain.connect(this.ctx.destination);

    // Dynamic cinematic countdown chord progression: Dm -> Bb -> F -> C
    const countdownChords = [
      { base: 146.83, notes: [146.83, 220.0, 293.66, 349.23, 440.0] },
      { base: 116.54, notes: [116.54, 174.61, 233.08, 293.66, 349.23] },
      { base: 87.31, notes: [87.31, 130.81, 174.61, 220.0, 261.63] },
      { base: 130.81, notes: [130.81, 196.0, 261.63, 329.63, 392.0] },
    ];

    let cIdx = 0;
    const playBar = () => {
      if (!this.countdownIsPlaying || !this.ctx || !this.countdownSynthGain) return;
      const t = this.ctx.currentTime;
      const chord = countdownChords[cIdx % countdownChords.length];
      cIdx++;

      chord.notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(freq, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450 + idx * 80, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.09 / (idx + 1), t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.countdownSynthGain);

        osc.start(t);
        osc.stop(t + 1.25);
      });
    };

    playBar();
    this.countdownSynthInterval = setInterval(playBar, 1000);
  }

  stopSynthCountdownBgm(fadeSec = 0.8) {
    if (this.countdownSynthInterval) {
      clearInterval(this.countdownSynthInterval);
      this.countdownSynthInterval = null;
    }

    if (this.countdownSynthGain && this.ctx) {
      try {
        const cur = Math.max(0.0001, this.countdownSynthGain.gain.value);
        this.countdownSynthGain.gain.setValueAtTime(cur, this.ctx.currentTime);
        this.countdownSynthGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + fadeSec);
        setTimeout(() => {
          if (!this.countdownIsPlaying && this.countdownSynthGain) {
            try { this.countdownSynthGain.disconnect(); } catch {}
            this.countdownSynthGain = null;
          }
        }, fadeSec * 1000 + 100);
      } catch {}
    }
  }

  playCountdown5to1(count) {
    // Replaced by continuous countdown music BGM behind the countdown (startCountdownBgm)
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

  /**
   * Continuous Soft Ceremonial Music (BGM)
   * Plays the official audio.mpeg track for the starting part
   * (from when "OPEN STAGE CURTAIN" is clicked through all opening slides
   * up to problem statement release).
   */
  startCeremonyBgm() {
    if (this.bgmIsPlaying) return;
    this.bgmIsPlaying = true;
    this.init();

    if (this.bgmFadeInterval) {
      clearInterval(this.bgmFadeInterval);
      this.bgmFadeInterval = null;
    }

    const targetVolume = this.muted ? 0 : 0.75;

    // 1. Primary: HTML5 Audio playing Audio.mpeg with smooth fade-in
    if (typeof window !== "undefined" && typeof Audio !== "undefined") {
      try {
        if (!this.bgmAudio) {
          this.bgmAudio = new Audio(this.audioSourceUrl);
          this.bgmAudio.loop = true;
          this.bgmAudio.preload = "auto";
        }

        this.bgmAudio.muted = this.muted;
        this.bgmAudio.volume = 0;
        this.bgmAudio.currentTime = 0;

        const playPromise = this.bgmAudio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Smooth fade-in over ~1.2s
              let cur = 0;
              const step = 0.05;
              this.bgmFadeInterval = setInterval(() => {
                if (!this.bgmIsPlaying || !this.bgmAudio) {
                  clearInterval(this.bgmFadeInterval);
                  this.bgmFadeInterval = null;
                  return;
                }
                cur = Math.min(targetVolume, cur + step);
                this.bgmAudio.volume = cur;
                if (cur >= targetVolume) {
                  clearInterval(this.bgmFadeInterval);
                  this.bgmFadeInterval = null;
                }
              }, 60);
            })
            .catch((err) => {
              console.warn("Audio.mpeg play blocked or failed; falling back to Web Audio pad:", err);
              this.startSynthCeremonyBgm();
            });
        }
      } catch (err) {
        console.warn("HTML5 Audio instantiation error, falling back:", err);
        this.startSynthCeremonyBgm();
      }
    } else {
      this.startSynthCeremonyBgm();
    }
  }

  stopCeremonyBgm(fadeSec = 1.2) {
    if (!this.bgmIsPlaying) return;
    this.bgmIsPlaying = false;

    if (this.bgmFadeInterval) {
      clearInterval(this.bgmFadeInterval);
      this.bgmFadeInterval = null;
    }

    // Stop synth pad if active
    this.stopSynthCeremonyBgm(fadeSec);

    // Smooth fade out of HTML5 Audio track
    if (this.bgmAudio) {
      const startVol = this.bgmAudio.volume;
      const steps = 15;
      const stepTime = Math.max(20, (fadeSec * 1000) / steps);
      let stepCount = 0;

      this.bgmFadeInterval = setInterval(() => {
        stepCount++;
        if (!this.bgmAudio) {
          clearInterval(this.bgmFadeInterval);
          this.bgmFadeInterval = null;
          return;
        }
        const newVol = Math.max(0, startVol * (1 - stepCount / steps));
        this.bgmAudio.volume = newVol;

        if (stepCount >= steps || newVol <= 0.01) {
          clearInterval(this.bgmFadeInterval);
          this.bgmFadeInterval = null;
          try {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
          } catch {}
        }
      }, stepTime);
    }
  }

  startSynthCeremonyBgm() {
    if (!this.ctx) return;
    if (this.bgmGain) return; // already active

    this.bgmGain = this.ctx.createGain();
    const targetVol = this.muted ? 0.0001 : 0.16;
    this.bgmGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.bgmGain.gain.exponentialRampToValueAtTime(targetVol, this.ctx.currentTime + 1.5);
    this.bgmGain.connect(this.ctx.destination);

    // Warm, majestic chords: Cmaj (C3-G3-C4-E4), Gmaj (G2-D3-G3-B3), Amin (A2-E3-A3-C4), Fmaj (F2-C3-F3-A3)
    const chords = [
      { base: 130.81, notes: [130.81, 196.0, 261.63, 329.63, 523.25] },
      { base: 98.0, notes: [98.0, 146.83, 196.0, 246.94, 392.0] },
      { base: 110.0, notes: [110.0, 164.81, 220.0, 261.63, 440.0] },
      { base: 87.31, notes: [87.31, 130.81, 174.61, 220.0, 349.23] },
    ];

    let chordIdx = 0;

    const playChordBar = () => {
      if (!this.bgmIsPlaying || !this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;
      const chord = chords[chordIdx % chords.length];
      chordIdx++;

      // Warm analog sustained pad with gentle overlap
      chord.notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(420 + idx * 75, t);

        padGain.gain.setValueAtTime(0.001, t);
        padGain.gain.linearRampToValueAtTime(0.08 / (idx + 1), t + 1.0);
        padGain.gain.exponentialRampToValueAtTime(0.0001, t + 4.8);

        osc.connect(filter);
        filter.connect(padGain);
        padGain.connect(this.bgmGain);

        osc.start(t);
        osc.stop(t + 4.9);
      });

      // Soft harmonic chime bells
      chord.notes.slice(1).forEach((freq, idx) => {
        const chimeTime = t + 0.45 + idx * 0.45;
        const osc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * 2, chimeTime);

        chimeGain.gain.setValueAtTime(0.001, chimeTime);
        chimeGain.gain.linearRampToValueAtTime(0.035, chimeTime + 0.06);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, chimeTime + 1.4);

        osc.connect(chimeGain);
        chimeGain.connect(this.bgmGain);

        osc.start(chimeTime);
        osc.stop(chimeTime + 1.5);
      });
    };

    // Play first chord immediately, then loop seamlessly every 4.2 seconds
    playChordBar();
    this.bgmInterval = setInterval(playChordBar, 4200);
  }

  stopSynthCeremonyBgm(fadeSec = 1.2) {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }

    if (this.bgmGain && this.ctx) {
      try {
        const cur = Math.max(0.0001, this.bgmGain.gain.value);
        this.bgmGain.gain.setValueAtTime(cur, this.ctx.currentTime);
        this.bgmGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + fadeSec);
        setTimeout(() => {
          if (!this.bgmIsPlaying && this.bgmGain) {
            try {
              this.bgmGain.disconnect();
            } catch {}
            this.bgmGain = null;
          }
        }, fadeSec * 1000 + 100);
      } catch {}
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.bgmAudio) {
      this.bgmAudio.muted = this.muted;
      this.bgmAudio.volume = this.muted ? 0 : 0.75;
    }
    if (this.countdownAudio) {
      this.countdownAudio.muted = this.muted;
      this.countdownAudio.volume = this.muted ? 0 : 0.85;
    }
    if (typeof document !== "undefined") {
      const vid = document.getElementById("countdown-5to1-video");
      if (vid) {
        vid.muted = this.muted;
        vid.volume = this.muted ? 0 : 1.0;
      }
    }
    if (this.bgmGain && this.ctx) {
      const vol = this.muted ? 0.0001 : 0.16;
      this.bgmGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
    if (this.countdownSynthGain && this.ctx) {
      const vol = this.muted ? 0.0001 : 0.22;
      this.countdownSynthGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
    return this.muted;
  }
}

export const sound = new SoundEffects();

