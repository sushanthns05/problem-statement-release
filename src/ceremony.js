import { THEMES } from "./problemStatements.js";
import { sound } from "./audio.js";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * ====================================================================
 * LAKSHYA 2026 BIG SCREEN AUDITORIUM CEREMONY CONTROLLER
 * 
 * Implements the exact 18-step presentation flow:
 * 1. Curtain (Grand velvet ceremonial stage curtain - manual open, begins continuous soft music)
 * 2. S J B Institute Of Technology (4s)
 * 3. Campus Photo (4s)
 * 4. Swamiji Photos(3) (4s)
 * 5. 25 year logo (4s)
 * 6. ISE Department (4s)
 * 7. Lakshya 2026 (4s)
 * 8. Sponsors-DLithe & ALL Logos (4s)
 * 9. Problem Statement-Big Screen Title (4s)
 * 10. Click on (Interactive Dignitary Launch Trigger - soft music plays until this release button is clicked!)
 * 11. Big Screen - Theme 1: Agriculture (Heroic Full Screen Showcase, 4s)
 * 12. Theme 1: Agriculture - Statements Table (10 problem statements, 30s animated showcase with progress bar)
 * 13. Big Screen - Theme 2: Smart & Sustainable Future (Heroic Full Screen Showcase, 4s)
 * 14. Theme 2: Smart & Sustainable Future - Statements Table (10 problem statements, 30s animated showcase with progress bar)
 * 15. Big Screen - Theme 3: Governance (Heroic Full Screen Showcase, 4s)
 * 16. Theme 3: Governance - Statements Table (10 problem statements, 30s animated showcase with progress bar)
 * 17. Countdown 5 to 1 (Curious mass beats)
 * 18. Display timer ("WE ARE LIVE!" + 24-Hour Countdown Timer)
 * ====================================================================
 */

export class CeremonyController {
  constructor(options = {}) {
    this.container = options.container || (typeof document !== "undefined" ? document.getElementById("screen-ceremony") : null);
    this.onComplete = options.onComplete || (() => {});
    this.onGlitter = options.onGlitter || (() => {});

    this.currentStepIndex = 0;
    this.isPaused = false;
    this.curtainOpen = false;
    this.stepTimer = null;
    this.progressInterval = null;
    this.countdownTimer = null;

    // Theme table timer state (30 seconds per theme)
    this.themeTableDuration = 30000;
    this.themeTableTimeRemaining = 30000;
    this.themeTableStartTime = 0;

    this.steps = this.buildSteps();
    if (this.container) {
      this.initDOM();
    }
  }

  buildSteps() {
    return [
      // 1. Curtain
      { id: "step-curtain", num: 1, title: "Curtain", type: "curtain", autoAdvance: false },
      // 2. S J B Institute Of Technology (4s)
      { id: "step-sjbit", num: 2, title: "S J B Institute Of Technology", type: "sjbit", duration: 4000 },
      // 3. Campus Photo (4s)
      { id: "step-campus", num: 3, title: "Campus Photo", type: "campus", duration: 4000 },
      // 4. Swamiji Photos(3) (4s)
      { id: "step-swamiji", num: 4, title: "Revered Swamijis", type: "swamiji", duration: 4000 },
      // 5. 25 year logo (4s)
      { id: "step-jubilee", num: 5, title: "25 Year Silver Jubilee", type: "jubilee", duration: 4000 },
      // 6. ISE Department (4s)
      { id: "step-ise", num: 6, title: "ISE Department", type: "ise", duration: 4000 },
      // 7. Lakshya (4s)
      { id: "step-lakshya", num: 7, title: "Lakshya 2026", type: "lakshya", duration: 4000 },
      // 8. Sponsors-DLithe ALL Logos (4s, Continuous soft music plays through here)
      { id: "step-sponsors", num: 8, title: "Sponsors & Accreditations", type: "sponsors", duration: 4000 },
      // 9. Problem Statement-Big Screen Title (4s, Continuous soft music plays through here)
      { id: "step-problem-title", num: 9, title: "Problem Statements", type: "problem-title", duration: 4000 },
      // 10. Click to Release (Continuous soft music plays until dignitary clicks to release!)
      { id: "step-click-on", num: 10, title: "Click to Release", type: "click-on", autoAdvance: false },
      // 11. Big Screen - Theme 1: Agriculture (4s)
      { id: "step-theme-1-intro", num: 11, title: "Theme 1: Agriculture - Big Screen", type: "theme-intro", themeIdx: 0, duration: 4000 },
      // 12. Theme 1: Agriculture - Table of 10 PS (30s)
      { id: "step-theme-1-table", num: 12, title: "Theme 1: Agriculture - Problem Statements Table", type: "theme-table", themeIdx: 0, duration: 30000 },
      // 13. Big Screen - Theme 2: Smart & Sustainable Future (4s)
      { id: "step-theme-2-intro", num: 13, title: "Theme 2: Smart & Sustainable Future - Big Screen", type: "theme-intro", themeIdx: 1, duration: 4000 },
      // 14. Theme 2: Smart & Sustainable Future - Table of 10 PS (30s)
      { id: "step-theme-2-table", num: 14, title: "Theme 2: Smart & Sustainable Future - Problem Statements Table", type: "theme-table", themeIdx: 1, duration: 30000 },
      // 15. Big Screen - Theme 3: Governance (4s)
      { id: "step-theme-3-intro", num: 15, title: "Theme 3: Governance - Big Screen", type: "theme-intro", themeIdx: 2, duration: 4000 },
      // 16. Theme 3: Governance - Table of 10 PS (30s)
      { id: "step-theme-3-table", num: 16, title: "Theme 3: Governance - Problem Statements Table", type: "theme-table", themeIdx: 2, duration: 30000 },
      // 17. Countdown 5 to 1
      { id: "step-countdown-5to1", num: 17, title: "Countdown 5 to 1", type: "countdown", duration: 5500 },
      // 18. Display Timer
      { id: "step-display-timer", num: 18, title: "Display Timer", type: "complete", duration: 2000 },
    ];
  }

  initDOM() {
    if (!this.container) return;

    // Render skeleton: Stage Viewport & Theatrical Velvet Curtain
    this.container.innerHTML = `
      <!-- THEATRICAL VELVET STAGE CURTAIN (Step 1) -->
      <div id="ceremony-curtain-stage" class="ceremony-curtain-stage" aria-label="Auditorium Stage Curtain">
        <div class="curtain-pelmet" aria-hidden="true">
          <div class="pelmet-fringe"></div>
        </div>
        <div id="curtain-left" class="curtain-drape curtain-left">
          <div class="curtain-folds"></div>
          <div class="curtain-gold-trim"></div>
          <div class="curtain-rope rope-left"></div>
        </div>
        <div id="curtain-right" class="curtain-drape curtain-right">
          <div class="curtain-folds"></div>
          <div class="curtain-gold-trim"></div>
          <div class="curtain-rope rope-right"></div>
        </div>

        <!-- Center Curtain Invitation Prompt -->
        <div id="curtain-center-prompt" class="curtain-center-prompt">
          <div class="curtain-event-badge">LAKSHYA 2026 &bull; SILVER JUBILEE EDITION</div>
          <h1 class="curtain-main-title">INAUGURATION CEREMONY</h1>
          <p class="curtain-inst-sub">Sri Adichunchanagiri Shikshana Trust&reg; &bull; SJB Institute of Technology</p>
          <button id="btn-open-curtain" class="btn-open-curtain" type="button" aria-label="Open Ceremony Stage Curtain">
            <span class="btn-curtain-icon">🎭</span>
            <span class="btn-curtain-text">OPEN STAGE CURTAIN</span>
          </button>
          <div class="curtain-hint">Press [Space] or [Enter] or Click to Open</div>
        </div>
      </div>

      <!-- MAIN CEREMONY STAGE SLIDE VIEWER -->
      <div id="ceremony-slide-viewport" class="ceremony-slide-viewport" role="region" aria-live="polite">
        <!-- Slide content dynamically rendered here -->
      </div>
    `;

    this.bindEvents();
    this.renderCurrentStep();
  }

  bindEvents() {
    const btnOpenCurtain = this.container.querySelector("#btn-open-curtain");
    if (btnOpenCurtain) {
      btnOpenCurtain.addEventListener("click", () => this.openCurtain());
    }

    // Comprehensive Keyboard Shortcuts (Screen clean, no UI toolbar)
    this.keyHandler = (e) => {
      // Don't intercept if inside input
      if (e.target && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (!this.curtainOpen && this.currentStepIndex === 0) {
          this.openCurtain();
        } else {
          this.togglePause();
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        this.nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.prevStep();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (!this.curtainOpen && this.currentStepIndex === 0) {
          this.openCurtain();
        } else if (this.steps[this.currentStepIndex]?.type === "click-on") {
          // If on Dignitary launch step, Enter triggers release
          const btnTrigger = this.container.querySelector("#btn-dignitary-trigger");
          if (btnTrigger) btnTrigger.click();
        } else {
          this.nextStep();
        }
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        sound.toggleMute();
      } else if (e.key === "Escape") {
        this.skipToTimer();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.keyHandler);
    }
  }

  destroy() {
    this.clearTimers();
    sound.stopCeremonyBgm(0.5);
    if (typeof window !== "undefined" && this.keyHandler) {
      window.removeEventListener("keydown", this.keyHandler);
    }
  }

  clearTimers() {
    if (this.stepTimer) clearTimeout(this.stepTimer);
    if (this.progressInterval) clearInterval(this.progressInterval);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.stepTimer = null;
    this.progressInterval = null;
    this.countdownTimer = null;
  }

  openCurtain() {
    if (this.curtainOpen) return;
    this.curtainOpen = true;

    sound.init();
    sound.playCurtainOpen();
    // Continuous soft music starts playing immediately when open stage curtain is pressed
    sound.startCeremonyBgm();

    const curtainStage = this.container.querySelector("#ceremony-curtain-stage");
    if (curtainStage) {
      curtainStage.classList.add("curtain-parting");
    }

    // Advance to Step 2: SJBIT after parting starts
    setTimeout(() => {
      if (curtainStage) curtainStage.classList.add("curtain-hidden");
      this.goToStep(1);
    }, 1800);
  }

  goToStep(index) {
    this.clearTimers();
    this.isPaused = false;
    this.updatePauseButton();

    if (index >= this.steps.length) {
      this.completeCeremony();
      return;
    }

    if (index < 0) index = 0;
    this.currentStepIndex = index;

    // Continuous soft music management:
    // Plays from Curtain (Step 1) continuously through Steps 1 to 10 (till problem statement release).
    // Fades out when advancing to Step 11 (Theme 1 Big Screen) or beyond.
    if (this.curtainOpen && this.currentStepIndex >= 1 && this.currentStepIndex <= 9) {
      sound.startCeremonyBgm();
    } else if (this.currentStepIndex >= 10) {
      sound.stopCeremonyBgm(1.2);
    }

    // Trigger subtle stage viewport ambient flash
    const viewport = this.container?.querySelector("#ceremony-slide-viewport");
    if (viewport) {
      viewport.classList.remove("viewport-transition-sweep");
      void viewport.offsetWidth;
      viewport.classList.add("viewport-transition-sweep");
    }

    this.renderCurrentStep();
  }

  nextStep() {
    if (!this.curtainOpen && this.currentStepIndex === 0) {
      this.openCurtain();
      return;
    }
    this.goToStep(this.currentStepIndex + 1);
  }

  prevStep() {
    if (this.currentStepIndex <= 1) {
      // Return to curtain closed
      this.curtainOpen = false;
      const curtainStage = this.container.querySelector("#ceremony-curtain-stage");
      if (curtainStage) {
        curtainStage.classList.remove("curtain-hidden", "curtain-parting");
      }
      this.goToStep(0);
      return;
    }
    this.goToStep(this.currentStepIndex - 1);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.updatePauseButton();

    const step = this.steps[this.currentStepIndex];
    if (this.isPaused) {
      this.clearTimers();
    } else {
      // Resume timer
      if (step.type === "theme-table") {
        this.startThemeTableTimer(this.themeTableTimeRemaining);
      } else if (step.duration) {
        this.stepTimer = setTimeout(() => this.nextStep(), step.duration);
      }
    }
  }

  updatePauseButton() {
    const btn = this.container?.querySelector("#btn-pres-pause");
    const icon = this.container?.querySelector("#pres-pause-icon");
    const text = this.container?.querySelector("#pres-pause-text");
    if (!btn) return;

    if (this.isPaused) {
      btn.classList.add("pres-btn-active");
      if (icon) icon.textContent = "▶";
      if (text) text.textContent = "Resume";
    } else {
      btn.classList.remove("pres-btn-active");
      if (icon) icon.textContent = "⏸";
      if (text) text.textContent = "Pause";
    }
  }

  updatePresenterStatus(step) {
    const badge = this.container?.querySelector("#presenter-step-badge");
    const name = this.container?.querySelector("#presenter-step-name");

    if (badge) {
      badge.textContent = `Step ${step.num} of 18`;
    }
    if (name) {
      name.textContent = step.title;
    }
  }

  renderCurrentStep() {
    const step = this.steps[this.currentStepIndex];
    const viewport = this.container?.querySelector("#ceremony-slide-viewport");
    if (!viewport) return;

    this.updatePresenterStatus(step);

    // Render matching slide HTML with unique page animations
    switch (step.type) {
      case "curtain":
        viewport.innerHTML = "";
        break;

      case "sjbit":
        viewport.innerHTML = this.renderSjbitSlide();
        this.scheduleAutoAdvance(step.duration);
        break;

      case "campus":
        viewport.innerHTML = this.renderCampusSlide();
        this.scheduleAutoAdvance(step.duration);
        break;

      case "swamiji":
        viewport.innerHTML = this.renderSwamijiSlide();
        this.scheduleAutoAdvance(step.duration);
        break;

      case "jubilee":
        viewport.innerHTML = this.renderJubileeSlide();
        this.scheduleAutoAdvance(step.duration);
        break;

      case "ise":
        viewport.innerHTML = this.renderIseSlide();
        this.scheduleAutoAdvance(step.duration);
        break;

      case "lakshya":
        viewport.innerHTML = this.renderLakshyaSlide();
        this.scheduleAutoAdvance(step.duration);
        break;

      case "sponsors":
        viewport.innerHTML = this.renderSponsorsSlide();
        this.scheduleAutoAdvance(step.duration);
        break;

      case "problem-title":
        viewport.innerHTML = this.renderProblemTitleSlide();
        this.scheduleAutoAdvance(step.duration);
        break;

      case "click-on":
        viewport.innerHTML = this.renderClickOnSlide();
        this.bindClickOnButton();
        break;

      case "theme-intro":
        viewport.innerHTML = this.renderThemeIntroSlide(step.themeIdx);
        sound.playThemeTransition();
        this.bindThemeIntroButton();
        this.scheduleAutoAdvance(step.duration || 4000);
        break;

      case "theme-table":
        viewport.innerHTML = this.renderThemeTableSlide(step);
        sound.playThemeTransition();
        this.bindThemeTableControls(step);
        this.startThemeTableTimer(step.duration || 30000);
        break;

      case "countdown":
        viewport.innerHTML = this.renderCountdownSlide();
        this.start5to1Countdown();
        break;

      case "complete":
        viewport.innerHTML = this.renderWeAreLiveSplash();
        sound.playGrandLaunchFanfare();
        this.onGlitter();
        setTimeout(() => this.completeCeremony(), 1800);
        break;
    }
  }

  scheduleAutoAdvance(duration) {
    if (!duration || this.isPaused) return;
    this.stepTimer = setTimeout(() => {
      this.nextStep();
    }, duration);
  }

  /**
   * 30-Second Theme Table Showcase Timer
   * Smoothly animates bottom progress bar and countdown readout.
   * Auto-advances when 30s completes.
   */
  startThemeTableTimer(durationMs = 30000) {
    this.themeTableDuration = durationMs;
    this.themeTableTimeRemaining = durationMs;
    this.themeTableStartTime = Date.now();

    const progressBar = this.container?.querySelector("#theme-table-timer-fill");
    const timeDisplay = this.container?.querySelector("#theme-table-seconds-num");

    const updateInterval = 50; // smooth 50ms tick
    this.progressInterval = setInterval(() => {
      if (this.isPaused) return;

      const elapsed = Date.now() - this.themeTableStartTime;
      this.themeTableTimeRemaining = Math.max(0, durationMs - elapsed);
      const remainingSecs = (this.themeTableTimeRemaining / 1000).toFixed(1);

      if (progressBar) {
        const percent = (this.themeTableTimeRemaining / durationMs) * 100;
        progressBar.style.width = `${percent}%`;
      }
      if (timeDisplay) {
        timeDisplay.textContent = remainingSecs;
      }

      if (this.themeTableTimeRemaining <= 0) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
        this.nextStep();
      }
    }, updateInterval);
  }

  bindThemeIntroButton() {
    const btnAdvance = this.container?.querySelector("#btn-intro-skip-to-table");
    if (btnAdvance) {
      btnAdvance.addEventListener("click", () => {
        sound.playThemeTransition();
        this.nextStep();
      });
    }
  }

  bindThemeTableControls(step) {
    const btnPrev = this.container?.querySelector("#btn-theme-prev");
    const btnNext = this.container?.querySelector("#btn-theme-next");
    const btnPause = this.container?.querySelector("#btn-theme-pause");

    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        sound.playThemeTransition();
        if (step.themeIdx === 1) {
          // From Theme 2 Table -> back to Theme 1 Table (step index 11)
          this.goToStep(11);
        } else if (step.themeIdx === 2) {
          // From Theme 3 Table -> back to Theme 2 Table (step index 13)
          this.goToStep(13);
        } else {
          // From Theme 1 Table -> back to Theme 1 Big Screen (step index 10)
          this.goToStep(10);
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener("click", () => {
        sound.playThemeTransition();
        if (step.themeIdx === 0) {
          // From Theme 1 Table -> advance to Theme 2 Big Screen (step index 12)
          this.goToStep(12);
        } else if (step.themeIdx === 1) {
          // From Theme 2 Table -> advance to Theme 3 Big Screen (step index 14)
          this.goToStep(14);
        } else if (step.themeIdx === 2) {
          // From Theme 3 Table -> advance to Countdown 5 to 1 (step index 16)
          this.goToStep(16);
        } else {
          this.nextStep();
        }
      });
    }

    if (btnPause) {
      btnPause.addEventListener("click", () => {
        this.togglePause();
        if (this.isPaused) {
          btnPause.textContent = "▶ Resume";
          btnPause.classList.add("theme-btn-active");
        } else {
          btnPause.textContent = "⏸ Pause";
          btnPause.classList.remove("theme-btn-active");
        }
      });
    }
  }

  bindClickOnButton() {
    const btn = this.container?.querySelector("#btn-dignitary-trigger");
    if (btn) {
      btn.addEventListener("click", () => {
        sound.init();
        // Official Problem Statement Release: Stop continuous soft music with smooth fade
        sound.stopCeremonyBgm(1.2);
        sound.playRevealChime();
        this.onGlitter();
        // Advance to Step 11: Big Screen for Theme 1: Agriculture!
        this.nextStep();
      });
    }
  }

  start5to1Countdown() {
    let count = 5;
    const digitDisplay = this.container?.querySelector("#countdown-5to1-digit");
    const labelDisplay = this.container?.querySelector("#countdown-5to1-label");

    const updateDisplay = (c) => {
      if (digitDisplay) {
        digitDisplay.textContent = c;
        digitDisplay.style.animation = "none";
        void digitDisplay.offsetWidth;
        digitDisplay.style.animation = "zoomPulse5to1 1s cubic-bezier(0.16, 1, 0.3, 1) forwards";
      }
      const ring = this.container?.querySelector(".countdown-5to1-ring-container");
      if (ring) {
        ring.style.animation = "none";
        void ring.offsetWidth;
        ring.style.animation = "countdownShockwaveBlast 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards";
      }
      if (labelDisplay) {
        const cues = { 5: "READY", 4: "PREPARE", 3: "GET", 2: "SET", 1: "LAUNCH!" };
        labelDisplay.textContent = cues[c] || "";
      }
      sound.playCountdown5to1(c);
    };

    updateDisplay(count);

    this.countdownTimer = setInterval(() => {
      if (this.isPaused) return;

      count--;
      if (count >= 1) {
        updateDisplay(count);
      } else {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.nextStep();
      }
    }, 1000);
  }

  completeCeremony() {
    this.clearTimers();
    sound.stopCeremonyBgm(0.5);
    this.onComplete();
  }

  skipToTimer() {
    this.clearTimers();
    sound.stopCeremonyBgm(0.5);
    this.onComplete();
  }

  /**
   * ====================================================================
   * SLIDE TEMPLATES (Ceremonial Grand Big Screen)
   * Each slide has a distinct, customized entrance animation!
   * ====================================================================
   */

  // Step 2: S J B Institute Of Technology (Royal Gold Crest Ascent)
  renderSjbitSlide() {
    return `
      <div class="ceremony-slide slide-sjbit">
        <div class="slide-ambient-glow"></div>
        <div class="sjbit-invocation">|| Jai Sri Gurudev ||</div>
        <div class="sjbit-trust">Sri Adichunchanagiri Shikshana Trust&reg;</div>
        
        <div class="sjbit-emblem-wrap">
          <img src="/assets/sjbit-orange-seal-circle.png" alt="SJBIT Emblem" class="sjbit-emblem-img" />
        </div>

        <h1 class="sjbit-college-title">SJB INSTITUTE OF TECHNOLOGY</h1>
        
        <div class="sjbit-address">
          No.67, BGS Health &amp; Education City, Dr. Vishnuvardhan Road, Kengeri, Bengaluru &ndash; 560060
        </div>

        <div class="sjbit-badge-row">
          <span class="sjbit-pill">An Autonomous Institute under VTU</span>
          <span class="sjbit-pill">Approved by AICTE</span>
          <span class="sjbit-pill">Accredited by NAAC A+</span>
          <span class="sjbit-pill">NBA Accredited</span>
        </div>
      </div>
    `;
  }

  // Step 3: Campus Photo (Panoramic Cinematic Aperture Reveal)
  renderCampusSlide() {
    return `
      <div class="ceremony-slide slide-campus">
        <div class="campus-header-bar">
          <span class="campus-tag">CAMPUS SHOWCASE</span>
          <h2 class="campus-title">SJB INSTITUTE OF TECHNOLOGY, BENGALURU</h2>
          <span class="campus-sub">Spread Across 50 Acres of Scenic Greenery &bull; BGS Health &amp; Education City</span>
        </div>
        <div class="campus-photo-frame">
          <img src="/assets/sjbit-campus-hd.jpg" alt="SJB Institute of Technology Campus" class="campus-main-photo" />
          <div class="campus-photo-caption">
            <span>Modern Academic Blocks &bull; State-of-the-Art Research Centers &bull; Lush Green Environment</span>
          </div>
        </div>
      </div>
    `;
  }

  // Step 4: Swamiji Photos(3) (Divine Blessing Radiant Aura Entrance)
  renderSwamijiSlide() {
    return `
      <div class="ceremony-slide slide-swamiji">
        <div class="swamiji-blessing-header">
          <div class="swamiji-invocation">|| Jai Sri Gurudev ||</div>
          <h2 class="swamiji-blessing-title">With the blessings of</h2>
        </div>

        <div class="swamiji-portraits-row">
          <!-- 1. Sri Sri Sri Dr.Balagangadharanatha Maha Swamiji -->
          <div class="swamiji-portrait-col">
            <div class="swamiji-portrait-circle">
              <img src="/assets/dignitary-nirmalanandanatha-clean.png" alt="His Divine Soul, Padmabhushana Sri Sri Sri Dr.Balagangadharanatha Maha Swamiji" />
            </div>
            <div class="swamiji-honorific">His Divine Soul, Padmabhushana</div>
            <h3 class="swamiji-title-name">Sri Sri Sri Dr.Balagangadharanatha Maha Swamiji</h3>
            <div class="swamiji-designation-text">Founder President, Sri Adichunchanagiri Shikshana Trust&reg;</div>
          </div>

          <!-- 2. Sri Sri Sri Dr.Nirmalanandanatha Maha Swamiji -->
          <div class="swamiji-portrait-col">
            <div class="swamiji-portrait-circle">
              <img src="/assets/dignitary-prakashnath-clean.png" alt="His Holiness Jagadguru Parama Pujya Sri Sri Sri Dr.Nirmalanandanatha Maha Swamiji" />
            </div>
            <div class="swamiji-honorific">His Holiness Jagadguru Parama Pujya</div>
            <h3 class="swamiji-title-name">Sri Sri Sri Dr.Nirmalanandanatha Maha Swamiji</h3>
            <div class="swamiji-designation-text">Chief Pontiff, Sri Adichunchanagiri Math &amp; President SACST&reg;</div>
          </div>

          <!-- 3. Sri Sri Dr.Prakashnatha Swamiji -->
          <div class="swamiji-portrait-col">
            <div class="swamiji-portrait-circle">
              <img src="/assets/dignitary-trustee-clean.png" alt="Revered Sri Sri Dr.Prakashnatha Swamiji" />
            </div>
            <div class="swamiji-presence-tag">In Divine Presence</div>
            <div class="swamiji-honorific">Revered</div>
            <h3 class="swamiji-title-name">Sri Sri Dr.Prakashnatha Swamiji</h3>
            <div class="swamiji-designation-text">Managing Director,<br/>BGS &amp; SJB Group of Institutions &amp; Hospitals</div>
          </div>
        </div>
      </div>
    `;
  }

  // Step 5: 25 year logo (Jubilee Spiral Burst & Radial Sunburst Aura)
  renderJubileeSlide() {
    return `
      <div class="ceremony-slide slide-jubilee">
        <div class="jubilee-radiant-glow"></div>
        <div class="jubilee-banner-tag">A HISTORIC MILESTONE</div>
        
        <div class="jubilee-emblem-wrap">
          <img src="/assets/sjbit-silver-jubilee-2026-hd.png" alt="SJBIT Silver Jubilee Year 2026 Emblem" class="jubilee-emblem-img" />
        </div>

        <h2 class="jubilee-title">SILVER JUBILEE YEAR 2026</h2>
        <div class="jubilee-subtitle">25 YEARS OF EXCELLENCE IN TECHNICAL EDUCATION (2001 &ndash; 2026)</div>
        <p class="jubilee-text">
          Celebrating a quarter century of pioneering engineering education, visionary research, and holistic student development.
        </p>
      </div>
    `;
  }

  // Step 6: ISE Department (Cyber Matrix Hex Scanline Entrance)
  renderIseSlide() {
    return `
      <div class="ceremony-slide slide-ise">
        <div class="ise-tag">HOST &amp; ORGANIZING DEPARTMENT</div>

        <div class="ise-logo-wrap">
          <img src="/assets/ise-dept-logo-clean.png" alt="Department of Information Science and Engineering" class="ise-logo-img" />
        </div>

        <h2 class="ise-dept-heading">DEPARTMENT OF INFORMATION SCIENCE AND ENGINEERING</h2>
        <div class="ise-college-sub">SJB Institute of Technology, Bengaluru &bull; Autonomous under VTU</div>
        
        <div class="ise-badges-row">
          <span class="ise-badge">NBA Accredited</span>
          <span class="ise-badge">Industry-Integrated Curriculum</span>
          <span class="ise-badge">Center of Excellence</span>
        </div>
      </div>
    `;
  }

  // Step 7: Lakshya (Epic Mountain Dawn Ascent)
  renderLakshyaSlide() {
    return `
      <div class="ceremony-slide slide-lakshya">
        <div class="lakshya-edition-tag">SILVER JUBILEE EDITION &bull; 5th &amp; 6th NOVEMBER 2026</div>

        <div class="lakshya-emblem-wrap">
          <img src="/assets/lakshya-mountain-logo.png" alt="Lakshya 2026 Mountain Emblem" class="lakshya-emblem-img" />
        </div>

        <h1 class="lakshya-hero-title">LAKSHYA 2026</h1>
        <div class="lakshya-hero-sub">A NATIONAL LEVEL 24 HOURS HACKATHON</div>

        <p class="lakshya-description">
          24 Hours of Relentless Innovation &bull; High-Impact Problem Solving &bull; Engineering the Future
        </p>
      </div>
    `;
  }

  // Step 8: Sponsors-DLithe ALL Logos (3D Card Unfold & Specular Metallic Sheen)
  renderSponsorsSlide() {
    return `
      <div class="ceremony-slide slide-sponsors">
        <div class="sponsors-header">
          <span class="sponsors-tag">COLLABORATION &amp; PARTNERSHIPS</span>
          <h2 class="sponsors-title">OUR SPONSORS &amp; ACCREDITATIONS</h2>
        </div>

        <!-- In Association with DLithe (Large prominent card) -->
        <div class="assoc-dlithe-card">
          <div class="assoc-label">IN ASSOCIATION WITH</div>
          <div class="assoc-dlithe-logo-wrap">
            <img src="/assets/dlithe-logo-clean.png" alt="DLithe - Be Agile..Be in Demand" class="assoc-dlithe-logo" />
          </div>
          <div class="assoc-tagline">Empowering Next-Gen Tech Talent &bull; Be Agile..Be in Demand</div>
        </div>

        <!-- All Institutional Accreditations -->
        <div class="all-logos-card">
          <div class="all-logos-title">INSTITUTIONAL ACCREDITATIONS &amp; AFFILIATIONS</div>
          <div class="all-logos-wrap">
            <img 
              src="/assets/accreditations-logos-blended.png" 
              alt="Accreditations: AICTE, NAAC A+, NBA, ARIIA, IIC, ISO 9001:2015, QS I-GAUGE GOLD, IEEE Bengaluru Section" 
              class="all-logos-img"
            />
          </div>
          <div class="all-logos-subtext">AICTE &bull; NAAC A+ &bull; NBA &bull; ARIIA &bull; IIC &bull; ISO 9001:2015 &bull; QS I-GAUGE &bull; IEEE</div>
        </div>
      </div>
    `;
  }

  // Step 9: Problem Statement-Big Screen Title (Cosmic Portal Expansion)
  renderProblemTitleSlide() {
    return `
      <div class="ceremony-slide slide-problem-title">
        <div class="prob-title-pill">
          <span class="prob-pulse-dot"></span>
          <span>OFFICIAL ANNOUNCEMENT</span>
        </div>

        <h1 class="prob-big-heading">PROBLEM STATEMENTS</h1>
        <div class="prob-big-sub">30 GROUNDBREAKING NATIONAL CHALLENGES ACROSS 3 THEMES</div>

        <div class="prob-themes-trio">
          <div class="prob-theme-capsule capsule-agri">
            <span class="capsule-icon">🌾</span>
            <span class="capsule-num">THEME 1</span>
            <span class="capsule-name">Agriculture</span>
            <span class="capsule-count">10 Challenges</span>
          </div>

          <div class="prob-theme-capsule capsule-ssf">
            <span class="capsule-icon">🌱</span>
            <span class="capsule-num">THEME 2</span>
            <span class="capsule-name">Smart &amp; Sustainable</span>
            <span class="capsule-count">10 Challenges</span>
          </div>

          <div class="prob-theme-capsule capsule-gov">
            <span class="capsule-icon">🏛</span>
            <span class="capsule-num">THEME 3</span>
            <span class="capsule-name">Governance</span>
            <span class="capsule-count">10 Challenges</span>
          </div>
        </div>
      </div>
    `;
  }

  // Step 10: Click to Release (Reactor Core Button Ignition Pulse)
  renderClickOnSlide() {
    return `
      <div class="ceremony-slide slide-click-on">
        <div class="click-invitation-badge">
          <span>👑</span>
          <span>HON'BLE PRINCIPAL, CHIEF GUESTS &amp; DIGNITARIES</span>
        </div>

        <h2 class="click-prompt-heading">OFFICIAL PROBLEM STATEMENT REVEAL</h2>
        <p class="click-prompt-sub">Please click the button below to initiate the ceremonial reveal of problem statements</p>

        <button id="btn-dignitary-trigger" class="btn-dignitary-launch" type="button" aria-label="Release Problem Statements">
          <span class="btn-launch-icon">🚀</span>
          <span class="btn-launch-text">CLICK TO RELEASE PROBLEM STATEMENTS</span>
        </button>
      </div>
    `;
  }

  // Steps 11, 13, 15: BIG SCREEN FOR THEMES (Grand Full-Screen Showcase)
  renderThemeIntroSlide(themeIdx) {
    const theme = THEMES[themeIdx];
    const themeNum = themeIdx + 1;
    const animClass = `anim-theme-bigscreen-${themeNum}`;

    return `
      <div class="ceremony-slide slide-theme-bigscreen slide-theme-bigscreen-${themeNum}" style="--theme-color: ${theme.accentColor};">
        <div class="theme-bigscreen-ambient" style="background: radial-gradient(circle at 50% 40%, ${theme.accentColor}35 0%, transparent 70%);"></div>

        <div class="theme-bigscreen-card ${animClass}">
          <div class="theme-bigscreen-badge-row">
            <span class="theme-bigscreen-pill" style="border-color: ${theme.accentColor}; color: ${theme.accentColor};">
              <span class="theme-bigscreen-pulse-dot" style="background: ${theme.accentColor};"></span>
              THEME ${themeNum} OF 3 &bull; OFFICIAL RELEASE
            </span>
            <span class="theme-bigscreen-count">10 Innovation Challenges</span>
          </div>

          <div class="theme-bigscreen-icon-wrap">
            <span class="theme-bigscreen-icon">${theme.icon}</span>
          </div>

          <h1 class="theme-bigscreen-title">
            <span class="theme-bigscreen-title-text" style="--title-accent: ${theme.accentColor};">${escapeHtml(theme.name.toUpperCase())}</span>
          </h1>

          <div class="theme-bigscreen-divider" style="background: linear-gradient(90deg, transparent, ${theme.accentColor}, transparent);"></div>

          <p class="theme-bigscreen-summary">${escapeHtml(theme.summary)}</p>

          <div class="theme-bigscreen-action-row">
            <div class="theme-bigscreen-hint">
              <span class="hint-pulse-beacon" style="background: ${theme.accentColor};"></span>
              <span>Displaying 10 Problem Statements Table...</span>
            </div>
            <button id="btn-intro-skip-to-table" class="btn-theme-intro-advance" type="button" aria-label="View Problem Statements Table">
              <span>VIEW STATEMENTS TABLE</span>
              <span class="btn-intro-arrow">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Steps 12, 14, 16: THEME TABLE SLIDES (All 10 statements displayed in animated table for 35s)
  renderThemeTableSlide(step) {
    const theme = THEMES[step.themeIdx];
    const tableAnimClass = `anim-table-theme-${step.themeIdx + 1}`;
    const isLastTheme = step.themeIdx === 2;
    const isFirstTheme = step.themeIdx === 0;

    return `
      <div class="ceremony-slide slide-theme-table slide-theme-table-${step.themeIdx + 1}" style="--theme-accent: ${theme.accentColor};">
        <!-- Slide Ambient Glow Backdrop -->
        <div class="theme-table-ambient-glow" style="background: radial-gradient(circle at 50% 20%, ${theme.accentColor}25 0%, transparent 65%);"></div>

        <!-- Theme Header Bar -->
        <div class="theme-table-header-bar">
          <div class="theme-table-badge-row">
            <span class="theme-table-pill" style="border-color: ${theme.accentColor}; color: ${theme.accentColor};">
              <span class="pill-dot" style="background: ${theme.accentColor};"></span>
              THEME ${step.themeIdx + 1} OF 3
            </span>
            <span class="theme-table-count-tag">10 Innovation Challenges &bull; 30-Second Showcase</span>
          </div>
          <h1 class="theme-table-main-title">
            <span class="theme-table-title-icon">${theme.icon}</span>
            <span class="theme-table-title-text" style="--title-color: ${theme.accentColor};">${escapeHtml(theme.name.toUpperCase())}</span>
          </h1>
          <p class="theme-table-summary">${escapeHtml(theme.summary)}</p>
        </div>

        <!-- The Animated Table Card -->
        <div class="ceremony-theme-table-card ${tableAnimClass}">
          <table class="ceremony-statements-table" role="table" aria-label="${theme.name} Problem Statements">
            <thead>
              <tr>
                <th class="th-challenge-header" scope="col">
                  <span class="th-accent-dot" style="background: ${theme.accentColor};"></span>
                  <span>PROBLEM STATEMENTS / INDUSTRY CHALLENGES</span>
                </th>
              </tr>
            </thead>
            <tbody>
              ${theme.problems.map((p, idx) => `
                <tr class="ceremony-theme-table-row" style="--row-i: ${idx};">
                  <td class="td-challenge-cell">
                    <span class="row-glow-bullet" style="color: ${theme.accentColor};">&bull;</span>
                    <span class="row-challenge-text">${escapeHtml(p.challenge)}</span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <!-- Bottom Showcase Bar: Progress Bar & Arrow Controls -->
        <div class="theme-table-bottom-bar">
          <div class="theme-table-timer-track">
            <div id="theme-table-timer-fill" class="theme-table-timer-fill" style="background: linear-gradient(90deg, ${theme.accentColor}, #ffd700); box-shadow: 0 0 14px ${theme.accentColor};"></div>
          </div>

          <div class="theme-table-controls-row">
            <button id="btn-theme-prev" class="theme-nav-btn ${isFirstTheme ? 'nav-disabled' : ''}" type="button" ${isFirstTheme ? 'disabled' : ''} aria-label="Previous Theme">
              <span class="nav-arrow">&larr;</span>
              <span>PREV THEME</span>
            </button>

            <div class="theme-table-timer-status">
              <span class="status-clock-icon">&bull;</span>
              <span class="status-clock-label">SHOWCASE TIMER:</span>
              <span class="status-clock-digits"><strong id="theme-table-seconds-num">35.0</strong>s</span>
              <button id="btn-theme-pause" class="theme-pause-btn" type="button" aria-label="Pause Theme Showcase">⏸ Pause</button>
            </div>

            <button id="btn-theme-next" class="theme-nav-btn theme-next-btn" type="button" aria-label="Next Theme">
              <span>${isLastTheme ? 'LAUNCH FINAL COUNTDOWN 5..1' : 'NEXT THEME'}</span>
              <span class="nav-arrow">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Step 17: Countdown 5 to 1 (High Energy Shockwave Pulse with Curious Mass Beats)
  renderCountdownSlide() {
    return `
      <div class="ceremony-slide slide-countdown-5to1">
        <div class="countdown-5to1-tag">FINAL COUNTDOWN TO COMMENCEMENT</div>
        <div class="countdown-5to1-ring-container">
          <div id="countdown-5to1-digit" class="countdown-5to1-digit">5</div>
        </div>
        <div id="countdown-5to1-label" class="countdown-5to1-action-label">READY</div>
        <div class="countdown-5to1-event">Lakshya 2026 &bull; 24-Hour Hackathon</div>
      </div>
    `;
  }

  // Step 18: We Are Live Splash (Confetti Boom & Fanfare)
  renderWeAreLiveSplash() {
    return `
      <div class="ceremony-slide slide-we-are-live">
        <div class="live-splash-beacon-row">
          <span class="live-splash-beacon"></span>
          <span class="live-splash-tag">HACKATHON IS OFFICIALLY INAUGURATED</span>
        </div>
        <h1 class="live-splash-title">WE ARE LIVE!</h1>
        <p class="live-splash-subtitle">Lakshya 2026 &bull; 24 Hours of Continuous Innovation Commences Now</p>
      </div>
    `;
  }
}
