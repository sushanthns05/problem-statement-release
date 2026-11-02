import { THEMES } from "./problemStatements.js";
import { sound } from "./audio.js";

/**
 * ====================================================================
 * LAKSHYA 2026 BIG SCREEN AUDITORIUM CEREMONY CONTROLLER
 * 
 * Implements the exact 17-step auditorium presentation flow:
 * 1. Curtain (Grand velvet ceremonial stage curtain)
 * 2. S J B Institute Of Technology
 * 3. Campus Photo
 * 4. Swamiji Photos(3)
 * 5. 25 year logo
 * 6. ISE Department
 * 7. Lakhsya
 * 8. Sponsers-DLithe & ALL Logos
 * 9. Problem Statement-Big Screen
 * 10. Click on (Interactive Dignitary Launch Trigger)
 * 11. Big Screen- Theme 1: Agriculture (Intro)
 * 11b. 10 Problem Statements one by one for 3 seconds each
 * 12. Big Screen- Theme 2: Smart & Sustainable Future Clean (Intro)
 * 13. 10 Problem Statements one by one for 3 seconds each
 * 14. Big Screen- Theme 3: Governance (Intro)
 * 15. 10 Problem Statements one by one for 3 seconds each
 * 16. Then show countdown 5 to 1
 * 17. Then display timer ("WE ARE LIVE!" + 24-Hour Timer)
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
    this.statementTimeRemaining = 3000;
    this.statementStartTime = 0;
    this.statementDuration = 3000; // 3 seconds per problem statement

    this.steps = this.buildSteps();
    if (this.container) {
      this.initDOM();
    }
  }

  buildSteps() {
    const list = [
      // 1. Curtain
      { id: "step-curtain", num: 1, title: "Curtain", type: "curtain", autoAdvance: false },
      // 2. S J B Institute Of Technology
      { id: "step-sjbit", num: 2, title: "S J B Institute Of Technology", type: "sjbit", duration: 5000 },
      // 3. Campus Photo
      { id: "step-campus", num: 3, title: "Campus Photo", type: "campus", duration: 5000 },
      // 4. Swamiji Photos(3)
      { id: "step-swamiji", num: 4, title: "Revered Swamijis", type: "swamiji", duration: 5500 },
      // 5. 25 year logo
      { id: "step-jubilee", num: 5, title: "25 Year Silver Jubilee", type: "jubilee", duration: 5000 },
      // 6. ISE Department
      { id: "step-ise", num: 6, title: "ISE Department", type: "ise", duration: 5000 },
      // 7. Lakshya
      { id: "step-lakshya", num: 7, title: "Lakshya 2026", type: "lakshya", duration: 5000 },
      // 8. Sponsors-DLithe ALL Logos
      { id: "step-sponsors", num: 8, title: "Sponsors & Accreditations", type: "sponsors", duration: 5500 },
      // 9. Problem Statement-Big Screen
      { id: "step-problem-title", num: 9, title: "Problem Statements", type: "problem-title", duration: 4500 },
      // 10. Click on
      { id: "step-click-on", num: 10, title: "Click to Release", type: "click-on", autoAdvance: false },
      // 11. Big Screen- Theme 1: Agriculture Intro
      { id: "step-theme-1-intro", num: 11, title: "Theme 1: Agriculture", type: "theme-intro", themeIdx: 0, duration: 3000 },
    ];

    // 11b. Display Theme 1 problem statements one by one for 3 seconds
    const theme1 = THEMES[0];
    theme1.problems.forEach((p, idx) => {
      list.push({
        id: `step-theme-1-p-${idx + 1}`,
        num: "11." + (idx + 1),
        title: `Agriculture Challenge ${idx + 1}/10`,
        type: "statement",
        themeIdx: 0,
        problem: p,
        indexInTheme: idx + 1,
        totalInTheme: 10,
        duration: 3000,
      });
    });

    // 12. Big Screen- Theme 2: Smart & Sustainable Future Clean Intro
    list.push({
      id: "step-theme-2-intro",
      num: 12,
      title: "Theme 2: Smart & Sustainable Future",
      type: "theme-intro",
      themeIdx: 1,
      duration: 3000,
    });

    // 13. Display Theme 2 problem statements one by one for 3 seconds
    const theme2 = THEMES[1];
    theme2.problems.forEach((p, idx) => {
      list.push({
        id: `step-theme-2-p-${idx + 1}`,
        num: "13." + (idx + 1),
        title: `Smart & Sustainable Challenge ${idx + 1}/10`,
        type: "statement",
        themeIdx: 1,
        problem: p,
        indexInTheme: idx + 1,
        totalInTheme: 10,
        duration: 3000,
      });
    });

    // 14. Big Screen- Theme 3: Governance Intro
    list.push({
      id: "step-theme-3-intro",
      num: 14,
      title: "Theme 3: Governance",
      type: "theme-intro",
      themeIdx: 2,
      duration: 3000,
    });

    // 15. Display Theme 3 problem statements one by one for 3 seconds
    const theme3 = THEMES[2];
    theme3.problems.forEach((p, idx) => {
      list.push({
        id: `step-theme-3-p-${idx + 1}`,
        num: "15." + (idx + 1),
        title: `Governance Challenge ${idx + 1}/10`,
        type: "statement",
        themeIdx: 2,
        problem: p,
        indexInTheme: idx + 1,
        totalInTheme: 10,
        duration: 3000,
      });
    });

    // 16. Then show countdown 5 to 1
    list.push({
      id: "step-countdown-5to1",
      num: 16,
      title: "Countdown 5 to 1",
      type: "countdown",
      duration: 5500,
    });

    // 17. Then display timer
    list.push({
      id: "step-display-timer",
      num: 17,
      title: "Display Timer",
      type: "complete",
      duration: 2000,
    });

    return list;
  }

  initDOM() {
    if (!this.container) return;

    // Render skeleton: Stage Viewport & Theatrical Velvet Curtain (No floating toolbar)
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
      if (step.type === "statement") {
        this.startStatementTimer(this.statementTimeRemaining);
      } else if (step.duration) {
        this.stepTimer = setTimeout(() => this.nextStep(), step.duration);
      }
    }
  }

  updatePauseButton() {
    const btn = this.container.querySelector("#btn-pres-pause");
    const icon = this.container.querySelector("#pres-pause-icon");
    const text = this.container.querySelector("#pres-pause-text");
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
    const badge = this.container.querySelector("#presenter-step-badge");
    const name = this.container.querySelector("#presenter-step-name");

    if (badge) {
      if (typeof step.num === "number") {
        badge.textContent = `Step ${step.num} of 17`;
      } else {
        badge.textContent = `Step ${step.num} / 17`;
      }
    }
    if (name) {
      name.textContent = step.title;
    }
  }

  renderCurrentStep() {
    const step = this.steps[this.currentStepIndex];
    const viewport = this.container.querySelector("#ceremony-slide-viewport");
    if (!viewport) return;

    this.updatePresenterStatus(step);

    // Render matching slide HTML
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
        this.scheduleAutoAdvance(step.duration);
        break;

      case "statement":
        viewport.innerHTML = this.renderStatementSlide(step);
        sound.playStatementTick();
        this.startStatementTimer(3000);
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

  startStatementTimer(durationMs) {
    this.statementDuration = durationMs;
    this.statementTimeRemaining = durationMs;
    this.statementStartTime = Date.now();

    const progressBar = this.container.querySelector("#statement-timer-fill");
    const timeDisplay = this.container.querySelector("#statement-seconds-num");

    const updateInterval = 50; // smooth 50ms tick
    this.progressInterval = setInterval(() => {
      if (this.isPaused) return;

      const elapsed = Date.now() - this.statementStartTime;
      this.statementTimeRemaining = Math.max(0, durationMs - elapsed);
      const remainingSecs = (this.statementTimeRemaining / 1000).toFixed(1);

      if (progressBar) {
        const percent = (this.statementTimeRemaining / durationMs) * 100;
        progressBar.style.width = `${percent}%`;
      }
      if (timeDisplay) {
        timeDisplay.textContent = remainingSecs;
      }

      if (this.statementTimeRemaining <= 0) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
        this.nextStep();
      }
    }, updateInterval);
  }

  bindClickOnButton() {
    const btn = this.container.querySelector("#btn-dignitary-trigger");
    if (btn) {
      btn.addEventListener("click", () => {
        sound.init();
        sound.playRevealChime();
        this.onGlitter();
        // Advance to Theme 1
        this.nextStep();
      });
    }
  }

  start5to1Countdown() {
    let count = 5;
    const digitDisplay = this.container.querySelector("#countdown-5to1-digit");
    const labelDisplay = this.container.querySelector("#countdown-5to1-label");

    const updateDisplay = (c) => {
      if (digitDisplay) {
        digitDisplay.textContent = c;
        digitDisplay.style.animation = "none";
        void digitDisplay.offsetWidth;
        digitDisplay.style.animation = "zoomPulse5to1 1s cubic-bezier(0.16, 1, 0.3, 1) forwards";
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
    this.onComplete();
  }

  skipToTimer() {
    this.clearTimers();
    this.onComplete();
  }

  /**
   * ====================================================================
   * SLIDE TEMPLATES (Ceremonial Grand Big Screen)
   * ====================================================================
   */

  // Step 2: S J B Institute Of Technology
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

  // Step 3: Campus Photo
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

  // Step 4: Swamiji Photos(3)
  renderSwamijiSlide() {
    return `
      <div class="ceremony-slide slide-swamiji">
        <div class="swamiji-blessing-header">
          <span class="swamiji-gold-tag">DIVINE BLESSINGS &amp; PATRONAGE</span>
          <h2 class="swamiji-main-title">REVERED SWAMIJIS &amp; TRUSTEES</h2>
          <p class="swamiji-lead-sub">Guiding SJB Institute of Technology towards Academic Excellence and Moral Eminence</p>
        </div>

        <div class="swamiji-trio-grid">
          <!-- 1. Jagadguru Dr. Nirmalanandanatha Mahaswamiji -->
          <div class="swamiji-card swamiji-card-primary">
            <div class="swamiji-portrait-halo">
              <img src="/assets/dignitary-nirmalanandanatha-clean.png" alt="His Holiness Jagadguru Sri Sri Sri Dr. Nirmalanandanatha Mahaswamiji" />
            </div>
            <h3 class="swamiji-name">His Holiness Jagadguru Sri Sri Sri<br/>Dr. Nirmalanandanatha Mahaswamiji</h3>
            <div class="swamiji-designation">
              Pontiff, Sri Adichunchanagiri Mahasamsthana Math<br/>
              President, Sri Adichunchanagiri Shikshana Trust&reg;
            </div>
          </div>

          <!-- 2. Revered Sri Sri Prakashnath Swamiji -->
          <div class="swamiji-card">
            <div class="swamiji-portrait-halo">
              <img src="/assets/dignitary-prakashnath-clean.png" alt="Revered Sri Sri Prakashnath Swamiji" />
            </div>
            <h3 class="swamiji-name">Revered Sri Sri<br/>Prakashnath Swamiji</h3>
            <div class="swamiji-designation">
              Managing Director<br/>
              BGS &amp; SJB Group of Institutions
            </div>
          </div>

          <!-- 3. Revered Trustee / Secretary -->
          <div class="swamiji-card">
            <div class="swamiji-portrait-halo">
              <img src="/assets/dignitary-trustee-clean.png" alt="Revered Trustee / Secretary" />
            </div>
            <h3 class="swamiji-name">Revered Trustee &amp;<br/>Secretary</h3>
            <div class="swamiji-designation">
              Sri Adichunchanagiri Shikshana Trust&reg;<br/>
              Bengaluru
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Step 5: 25 year logo
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

  // Step 6: ISE Department
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

  // Step 7: Lakshya
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

  // Step 8: Sponsors-DLithe ALL Logos
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

  // Step 9: Problem Statement-Big Screen
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

  // Step 10: Click on
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

        <div class="click-action-note">
          30 Innovation Challenges will be unveiled theme-wise on the big screen
        </div>
      </div>
    `;
  }

  // Step 11, 12, 14: Theme Intro Cards
  renderThemeIntroSlide(themeIdx) {
    const theme = THEMES[themeIdx];
    return `
      <div class="ceremony-slide slide-theme-intro" style="--theme-color: ${theme.accentColor};">
        <div class="theme-intro-card">
          <div class="theme-intro-badge-row">
            <span class="theme-intro-pill">${theme.badge}</span>
            <span class="theme-intro-count">10 Problem Statements &bull; 3s Per Challenge</span>
          </div>

          <div class="theme-intro-icon">${theme.icon}</div>
          <h1 class="theme-intro-title">${theme.name}</h1>
          <p class="theme-intro-summary">${theme.summary}</p>

          <div class="theme-intro-timer-hint">
            <span>Displaying Problem Statements One by One on Big Screen...</span>
          </div>
        </div>
      </div>
    `;
  }

  // Step 11b, 13, 15: Problem Statement (1 by 1 for 3 seconds)
  renderStatementSlide(step) {
    const theme = THEMES[step.themeIdx];
    return `
      <div class="ceremony-slide slide-statement" style="--theme-color: ${theme.accentColor};">
        <!-- Top Theme Header -->
        <div class="statement-top-bar">
          <div class="statement-theme-tag">
            <span class="statement-icon">${theme.icon}</span>
            <span class="statement-theme-name">${theme.name}</span>
          </div>
          <div class="statement-counter-pill">
            Challenge ${step.indexInTheme} of ${step.totalInTheme}
          </div>
        </div>

        <!-- Center Problem Statement in Massive Legible Font -->
        <div class="statement-center-box">
          <div class="statement-quote-badge">PROBLEM STATEMENT</div>
          <h1 class="statement-challenge-text">${step.problem.challenge}</h1>
        </div>

        <!-- 3-Second Visual Progress Indicator Bar -->
        <div class="statement-bottom-timer-bar">
          <div class="statement-timer-track">
            <div id="statement-timer-fill" class="statement-timer-fill"></div>
          </div>
          <div class="statement-timer-meta">
            <span class="timer-meta-label">3-SECOND BIG SCREEN DISPLAY</span>
            <span class="timer-meta-time"><strong id="statement-seconds-num">3.0</strong>s</span>
          </div>
        </div>
      </div>
    `;
  }

  // Step 16: Countdown 5 to 1
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

  // Step 17: We Are Live Splash
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
