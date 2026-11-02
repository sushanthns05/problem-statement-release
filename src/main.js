import { CONFIG } from "./config.js";
import { THEMES } from "./problemStatements.js";
import {
  getStoredLaunchTime,
  saveLaunchTime,
  clearStoredLaunchTime,
  get24HourRemaining,
  format24HourDisplay,
  shouldAnnounceToScreenReader,
} from "./timer.js";
import { ParticleBackground } from "./particles.js";
import { GlitterEngine } from "./glitter.js";
import { sound } from "./audio.js";
import { CeremonyController } from "./ceremony.js";

/**
 * ====================================================================
 * APPLICATION CONTROLLER (Lakshya 2026 Hackathon)
 * ====================================================================
 */

// State
let currentScreen = "CEREMONY";
let currentThemeIndex = 0;
let launchTimestamp = getStoredLaunchTime();
let countdownInterval = null;
let introInterval = null;
let liveSplashTimeout = null;
let particleBg = null;
let glitterEngine = null;
let ceremonyController = null;
let lastAnnouncedMinute = null;

// DOM Elements
const screenCeremony = document.getElementById("screen-ceremony");
const screenLanding = document.getElementById("screen-landing");
const screenIntro = document.getElementById("screen-intro");
const screenProblems = document.getElementById("screen-problems");
const screenCountdown = document.getElementById("screen-countdown");

const headerStatusBadge = document.getElementById("header-status-badge");
const headerStatusText = document.getElementById("header-status-text");

// Landing Elements
const btnLaunchNow = document.getElementById("btn-launch-now");
const btnSkipIntro = document.getElementById("btn-skip-intro");
const btnToggleSound = document.getElementById("btn-toggle-sound");
const soundIcon = document.getElementById("sound-icon");
const btnToggleFullscreen = document.getElementById("btn-toggle-fullscreen");

// 3-2-1 Overlay Elements
const introCountdownBox = document.getElementById("intro-countdown-box");
const introLiveSplash = document.getElementById("intro-live-splash");
const introNumberDisplay = document.getElementById("intro-number-display");
const introLabelDisplay = document.getElementById("intro-label-display");
const introSvgProgress = document.getElementById("intro-svg-progress");

// Problem Statements Elements
const problemsTableBody = document.getElementById("problems-table-body");
const themeIndexBadge = document.getElementById("theme-index-badge");
const themeTitleText = document.getElementById("theme-title-text");
const themeCategoryTag = document.getElementById("theme-category-tag");
const btnPrevTheme = document.getElementById("btn-prev-theme");
const btnNextTheme = document.getElementById("btn-next-theme");
const btnNextLabel = document.getElementById("btn-next-label");
const themeStepIndicators = document.getElementById("theme-step-indicators");

// 24-Hour Countdown Screen Elements
const digitHours = document.getElementById("digit-hours");
const digitMinutes = document.getElementById("digit-minutes");
const digitSeconds = document.getElementById("digit-seconds");
const digitCentis = document.getElementById("digit-centis");
const hackathonProgressBar = document.getElementById("hackathon-progress-bar");
const elapsedPercentLabel = document.getElementById("elapsed-percent-label");

const btnFireGlitter = document.getElementById("btn-fire-glitter");
const btnResetCeremony = document.getElementById("btn-reset-ceremony");
const btnViewProblems = document.getElementById("btn-view-problems");

const srAnnouncer = document.getElementById("sr-countdown-announcer");
const particleCanvas = document.getElementById("particle-canvas");
const glitterCanvas = document.getElementById("glitter-canvas");

/**
 * Utility: Safe HTML Escape
 */
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
 * Initialize Branding from CONFIG
 */
function initContent() {
  document.title = `${CONFIG.eventName} | 24-Hour Hackathon Launch Countdown`;

  const deptTitle = document.getElementById("header-dept-title");
  if (deptTitle) deptTitle.textContent = "Department of Information Science & Engineering";

  const collegeTitle = document.getElementById("header-college-title");
  if (collegeTitle) collegeTitle.textContent = "SJB Institute of Technology";
}

/**
 * Switch Active Screen
 * @param {'CEREMONY' | 'LANDING' | 'INTRO' | 'PROBLEMS' | 'COUNTDOWN'} targetState
 */
export function setScreen(targetState) {
  currentScreen = targetState;

  // Toggle body classes for screen specific layouts
  document.body.classList.toggle("screen-problems-active", targetState === "PROBLEMS");
  document.body.classList.toggle("screen-ceremony-active", targetState === "CEREMONY");

  if (screenCeremony) screenCeremony.classList.remove("active");
  screenLanding.classList.remove("active");
  screenIntro.classList.remove("active");
  if (screenProblems) screenProblems.classList.remove("active");
  screenCountdown.classList.remove("active");

  // If leaving ceremony, stop any active ceremony timer and BGM
  if (targetState !== "CEREMONY") {
    if (ceremonyController) {
      ceremonyController.clearTimers();
    }
    sound.stopCeremonyBgm(1.0);
  }

  // Update header status indicators
  if (targetState === "COUNTDOWN") {
    if (headerStatusText) headerStatusText.textContent = "🔴 LIVE: 24-HR COUNTDOWN";
    if (headerStatusBadge) {
      headerStatusBadge.classList.add("status-live");
      headerStatusBadge.setAttribute("aria-label", "Status: 24-Hour Hackathon is Officially Live");
    }
  } else if (targetState === "PROBLEMS") {
    if (headerStatusText) {
      headerStatusText.textContent = launchTimestamp
        ? "🔴 LIVE • PROBLEM STATEMENTS"
        : `📋 PROBLEM STATEMENTS: THEME ${currentThemeIndex + 1}/3`;
    }
    if (headerStatusBadge) {
      if (launchTimestamp) headerStatusBadge.classList.add("status-live");
      else headerStatusBadge.classList.remove("status-live");
      headerStatusBadge.setAttribute("aria-label", "Status: Problem Statements Released");
    }
  } else if (targetState === "CEREMONY") {
    if (headerStatusText) headerStatusText.textContent = "🎭 AUDITORIUM CEREMONY MODE";
    if (headerStatusBadge) {
      headerStatusBadge.classList.remove("status-live");
      headerStatusBadge.setAttribute("aria-label", "Status: Ceremony Mode");
    }
  } else {
    if (headerStatusText) headerStatusText.textContent = "AWAITING INAUGURATION";
    if (headerStatusBadge) {
      headerStatusBadge.classList.remove("status-live");
      headerStatusBadge.setAttribute("aria-label", "Status: Awaiting Inauguration");
    }
  }

  switch (targetState) {
    case "CEREMONY":
      if (screenCeremony) {
        screenCeremony.classList.add("active");
        if (!ceremonyController) {
          ceremonyController = new CeremonyController({
            container: screenCeremony,
            onComplete: () => {
              if (!launchTimestamp) {
                launchTimestamp = saveLaunchTime(Date.now());
              }
              if (glitterEngine) {
                glitterEngine.explodeGlitter(380);
              }
              setScreen("COUNTDOWN");
            },
            onGlitter: () => {
              if (glitterEngine) {
                glitterEngine.explodeGlitter(300);
              }
            },
          });
        }
      }
      break;

    case "LANDING":
      screenLanding.classList.add("active");
      if (particleBg) particleBg.start();
      break;

    case "INTRO":
      screenIntro.classList.add("active");
      startIntroSequence();
      break;

    case "PROBLEMS":
      if (screenProblems) {
        screenProblems.classList.add("active");
        renderTheme(currentThemeIndex);
      }
      if (particleBg) particleBg.start();
      break;

    case "COUNTDOWN":
      screenCountdown.classList.add("active");
      if (particleBg) particleBg.start();
      start24HourTimer();
      break;
  }
}

/**
 * ====================================================================
 * SCREEN 2: 3-2-1 INAUGURATION SEQUENCE (GET -> SET -> GO)
 * When 3, 2, 1 completes -> Problem Statements are released!
 * ====================================================================
 */
function startIntroSequence() {
  // Ensure 3-2-1 box is visible, hide splash overlay
  if (introCountdownBox) introCountdownBox.style.display = "flex";
  if (introLiveSplash) introLiveSplash.style.display = "none";

  let count = 3;
  updateIntroStep(count);

  if (introInterval) clearInterval(introInterval);
  if (liveSplashTimeout) clearTimeout(liveSplashTimeout);

  introInterval = setInterval(() => {
    count--;

    if (count > 0) {
      updateIntroStep(count);
    } else {
      clearInterval(introInterval);
      introInterval = null;

      // 3-2-1 is complete! Release problem statements!
      releaseProblemStatements();
    }
  }, 1000);
}

function updateIntroStep(count) {
  const labels = {
    3: "GET",
    2: "SET",
    1: "GO!",
  };

  if (introNumberDisplay) introNumberDisplay.textContent = count;
  if (introLabelDisplay) introLabelDisplay.textContent = labels[count] || "";

  sound.playIntroBeep(count);

  // Re-trigger zoom animations
  if (introNumberDisplay) {
    introNumberDisplay.style.animation = "none";
    void introNumberDisplay.offsetWidth;
    introNumberDisplay.style.animation = "numberZoomFade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards";
  }
  if (introLabelDisplay) {
    introLabelDisplay.style.animation = "none";
    void introLabelDisplay.offsetWidth;
    introLabelDisplay.style.animation = "actionWordPop 1s cubic-bezier(0.16, 1, 0.3, 1) forwards";
  }

  updateSvgRing(count);
}

function updateSvgRing(count) {
  if (!introSvgProgress) return;
  const circumference = 2 * Math.PI * 100;
  const offset = circumference * (1 - count / 3);
  introSvgProgress.style.strokeDashoffset = `${offset}`;
}

/**
 * UNLOCK & RELEASE PROBLEM STATEMENTS (Theme 1: Agriculture)
 */
function releaseProblemStatements() {
  if (introInterval) {
    clearInterval(introInterval);
    introInterval = null;
  }
  if (liveSplashTimeout) {
    clearTimeout(liveSplashTimeout);
    liveSplashTimeout = null;
  }

  // Auditory chime and glitter celebration on release
  sound.playRevealChime();
  if (glitterEngine) {
    glitterEngine.explodeGlitter(260);
  }

  // Announce for accessibility
  announceScreenReader("Problem statements officially released! Showing Theme 1: Agriculture.");

  // Switch to Problem Statements screen with Theme 1
  currentThemeIndex = 0;
  setScreen("PROBLEMS");
}

function skipIntro() {
  releaseProblemStatements();
}

/**
 * ====================================================================
 * PROBLEM STATEMENTS CONTROLLER (10 per theme, Arrow Navigation)
 * ====================================================================
 */
function renderTheme(themeIndex) {
  currentThemeIndex = Math.max(0, Math.min(themeIndex, THEMES.length - 1));
  const theme = THEMES[currentThemeIndex];
  if (!theme) return;

  // Header status indicator
  if (headerStatusText && !launchTimestamp) {
    headerStatusText.textContent = `📋 PROBLEM STATEMENTS: THEME ${currentThemeIndex + 1}/3`;
  }

  // Update Theme Header
  if (themeIndexBadge) {
    themeIndexBadge.textContent = theme.badge;
  }
  if (themeTitleText) {
    themeTitleText.textContent = theme.name;
    themeTitleText.style.setProperty("--theme-accent", theme.accentColor);
  }
  if (themeCategoryTag) {
    themeCategoryTag.textContent = `${theme.problems.length} Problem Statements`;
  }

  // Render exactly 10 problem statements (only problem statements)
  if (problemsTableBody) {
    problemsTableBody.innerHTML = theme.problems
      .map(
        (p) => `
      <tr class="problem-row">
        <td class="td-challenge"><span class="problem-challenge-text">${escapeHtml(p.challenge)}</span></td>
      </tr>`
      )
      .join("");
  }

  // Update Previous Button state
  if (btnPrevTheme) {
    if (currentThemeIndex === 0) {
      btnPrevTheme.disabled = true;
      btnPrevTheme.classList.add("nav-disabled");
    } else {
      btnPrevTheme.disabled = false;
      btnPrevTheme.classList.remove("nav-disabled");
    }
  }

  // Update Next Button text & style
  if (btnNextTheme && btnNextLabel) {
    if (currentThemeIndex < THEMES.length - 1) {
      const nextTheme = THEMES[currentThemeIndex + 1];
      btnNextLabel.textContent = `Next Theme: ${nextTheme.name}`;
      btnNextTheme.classList.remove("btn-we-are-live");
      btnNextTheme.setAttribute("aria-label", `Navigate to Theme ${currentThemeIndex + 2}: ${nextTheme.name}`);
    } else {
      // Final theme (Theme 3: Governance)
      if (launchTimestamp) {
        btnNextLabel.textContent = "Return to 24H Live Countdown";
        btnNextTheme.classList.add("btn-we-are-live");
        btnNextTheme.setAttribute("aria-label", "Return to 24-Hour Live Countdown Screen");
      } else {
        btnNextLabel.textContent = "Start 24-Hr Hackathon: We Are Live";
        btnNextTheme.classList.add("btn-we-are-live");
        btnNextTheme.setAttribute("aria-label", "Inaugurate 24-Hour Hackathon and Show We Are Live");
      }
    }
  }

  // Update Pagination / Step Indicator Pills
  if (themeStepIndicators) {
    const pills = themeStepIndicators.querySelectorAll(".theme-step-pill");
    pills.forEach((pill, idx) => {
      const isSelected = idx === currentThemeIndex;
      pill.classList.toggle("active", isSelected);
      pill.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
  }

  // Announce for screen reader
  announceScreenReader(`Showing Theme ${currentThemeIndex + 1} of 3: ${theme.name}. 10 problem statements.`);
}

function handleNextTheme() {
  if (currentThemeIndex < THEMES.length - 1) {
    currentThemeIndex++;
    sound.playThemeTransition();
    renderTheme(currentThemeIndex);
  } else {
    // If hackathon is already running, return directly to Countdown
    if (launchTimestamp) {
      setScreen("COUNTDOWN");
    } else {
      // User is on the final theme and clicked forward: Trigger automated "WE ARE LIVE" function!
      triggerAutomatedWeAreLive();
    }
  }
}

function handlePrevTheme() {
  if (currentThemeIndex > 0) {
    currentThemeIndex--;
    sound.playThemeTransition();
    renderTheme(currentThemeIndex);
  }
}

/**
 * ====================================================================
 * AUTOMATED "WE ARE LIVE!" FUNCTION
 * Displays triumphant splash screen + fanfare + glitter, then starts 24H countdown
 * ====================================================================
 */
function triggerAutomatedWeAreLive() {
  // Switch to Intro overlay with LIVE splash screen active
  screenLanding.classList.remove("active");
  if (screenProblems) screenProblems.classList.remove("active");
  screenCountdown.classList.remove("active");
  screenIntro.classList.add("active");

  showLiveSplashMessage();
}

/**
 * DISPLAY "WE ARE LIVE!" MESSAGE + GLITTER EXPLOSION
 */
function showLiveSplashMessage() {
  // Hide 3-2-1 circle, reveal grand LIVE Splash
  if (introCountdownBox) introCountdownBox.style.display = "none";
  if (introLiveSplash) introLiveSplash.style.display = "flex";

  // Save the official launch timestamp
  if (!launchTimestamp) {
    launchTimestamp = saveLaunchTime(Date.now());
  }

  // Trigger dense glitter explosion
  if (glitterEngine) {
    glitterEngine.explodeGlitter(380);
  }

  // Triumphant ceremonial fanfare
  sound.playGrandLaunchFanfare();

  // Update header status immediately to LIVE
  if (headerStatusBadge) headerStatusBadge.classList.add("status-live");
  if (headerStatusText) headerStatusText.textContent = "🔴 LIVE: 24-HR COUNTDOWN";

  announceScreenReader("Lakshya 2026 is officially live! 24-hour hackathon countdown commenced.");

  // Hold the LIVE Message for 1.8 seconds, then transition to 24-Hour Timer
  liveSplashTimeout = setTimeout(() => {
    setScreen("COUNTDOWN");
  }, 1800);
}

/**
 * ====================================================================
 * SCREEN 3: LIVE 24-HOUR COUNTDOWN ENGINE
 * ====================================================================
 */
function start24HourTimer() {
  if (countdownInterval) clearInterval(countdownInterval);

  if (!launchTimestamp) {
    launchTimestamp = saveLaunchTime(Date.now());
  }

  const durationHours = CONFIG.durationHours || 24;

  const updateClock = () => {
    const timeRemaining = get24HourRemaining(launchTimestamp, Date.now(), durationHours);
    const formatted = format24HourDisplay(timeRemaining);

    // Update digits
    updateDigit(digitHours, formatted.hoursStr);
    updateDigit(digitMinutes, formatted.minutesStr);
    updateDigit(digitSeconds, formatted.secondsStr);

    if (digitCentis) {
      digitCentis.textContent = formatted.centisStr;
    }

    // Update progress bar
    if (hackathonProgressBar) {
      hackathonProgressBar.style.width = `${timeRemaining.elapsedPercent.toFixed(1)}%`;
    }
    if (elapsedPercentLabel) {
      elapsedPercentLabel.textContent = `${timeRemaining.elapsedPercent.toFixed(1)}% Elapsed`;
    }

    // Accessible Screen Reader
    if (shouldAnnounceToScreenReader(lastAnnouncedMinute, timeRemaining.minutes, timeRemaining.isExpired)) {
      lastAnnouncedMinute = timeRemaining.minutes;
      if (timeRemaining.isExpired) {
        announceScreenReader("The 24-hour hackathon time has completed!");
      } else {
        announceScreenReader(
          `24-hour hackathon countdown: ${timeRemaining.hours} hours and ${timeRemaining.minutes} minutes remaining.`
        );
      }
    }

    if (timeRemaining.isExpired) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      if (glitterEngine) glitterEngine.explodeGlitter(150);
      if (headerStatusText) headerStatusText.textContent = "⏱ TIME COMPLETED";
    }
  };

  updateClock();
  countdownInterval = setInterval(updateClock, 50); // 50ms for smooth centiseconds
}

function updateDigit(element, newText) {
  if (!element) return;
  if (element.textContent !== newText) {
    element.textContent = newText;
    element.classList.remove("tick");
    void element.offsetWidth;
    element.classList.add("tick");
  }
}

function announceScreenReader(message) {
  if (srAnnouncer) {
    srAnnouncer.textContent = message;
  }
}

/**
 * Event Listeners & Stage Controls
 */
function initEventListeners() {
  // Sound ON by default: Unlock Web Audio API on first user gesture
  const unlockAudio = () => {
    sound.init();
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
  };
  window.addEventListener("click", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
  window.addEventListener("touchstart", unlockAudio, { once: true });

  // Fullscreen keyboard shortcut: Press "F" or "f" to toggle fullscreen automatically
  window.addEventListener("keydown", (e) => {
    if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
    if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request error:", err);
        });
      } else {
        document.exitFullscreen().catch((err) => {
          console.warn("Exit fullscreen error:", err);
        });
      }
    }

    // Keyboard Arrow navigation for problem statements
    if (currentScreen === "PROBLEMS") {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextTheme();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevTheme();
      }
    }
  });

  // Principal Launch Button -> Starts 17-Step Big Screen Ceremony
  if (btnLaunchNow) {
    btnLaunchNow.addEventListener("click", () => {
      sound.init(); // Initialize Web Audio API on click gesture
      setScreen("CEREMONY");
      if (ceremonyController) {
        ceremonyController.goToStep(0);
      }
    });
  }

  // Replay Big Screen Ceremony Button from 24H countdown screen
  const btnReplayCeremony = document.getElementById("btn-replay-ceremony");
  if (btnReplayCeremony) {
    btnReplayCeremony.addEventListener("click", () => {
      sound.init();
      setScreen("CEREMONY");
      if (ceremonyController) {
        ceremonyController.goToStep(0);
      }
    });
  }

  // Skip Intro Button
  if (btnSkipIntro) {
    btnSkipIntro.addEventListener("click", skipIntro);
  }

  // Problem Statements Navigation: Prev / Next Arrow buttons
  if (btnPrevTheme) {
    btnPrevTheme.addEventListener("click", handlePrevTheme);
  }
  if (btnNextTheme) {
    btnNextTheme.addEventListener("click", handleNextTheme);
  }

  // Problem Statements Theme Step Indicator Click
  if (themeStepIndicators) {
    themeStepIndicators.addEventListener("click", (e) => {
      const pill = e.target.closest(".theme-step-pill");
      if (!pill) return;
      const targetIdx = parseInt(pill.getAttribute("data-theme-idx"), 10);
      if (!isNaN(targetIdx) && targetIdx !== currentThemeIndex) {
        currentThemeIndex = targetIdx;
        sound.playThemeTransition();
        renderTheme(currentThemeIndex);
      }
    });
  }

  // View Problem Statements from Countdown Screen
  if (btnViewProblems) {
    btnViewProblems.addEventListener("click", () => {
      sound.init();
      setScreen("PROBLEMS");
    });
  }

  // Optional Sound FX Toggle (if present)
  if (btnToggleSound) {
    btnToggleSound.addEventListener("click", () => {
      const isMuted = sound.toggleMute();
      if (soundIcon) soundIcon.textContent = isMuted ? "🔇" : "🔊";
      btnToggleSound.setAttribute("title", isMuted ? "Sound is Muted" : "Sound is Active");
    });
  }

  // Optional Fullscreen Button (if present)
  if (btnToggleFullscreen) {
    btnToggleFullscreen.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request error:", err);
        });
      } else {
        document.exitFullscreen().catch((err) => {
          console.warn("Exit fullscreen error:", err);
        });
      }
    });
  }

  // Trigger Glitter Button
  if (btnFireGlitter) {
    btnFireGlitter.addEventListener("click", () => {
      if (glitterEngine) {
        glitterEngine.explodeGlitter(300);
      }
      sound.playGrandLaunchFanfare();
    });
  }

  // Reset Ceremony for Principal Re-launch
  if (btnResetCeremony) {
    btnResetCeremony.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Reset Hackathon Launch Ceremony back to the Stage Curtain?"
      );
      if (confirmed) {
        if (countdownInterval) clearInterval(countdownInterval);
        if (liveSplashTimeout) clearTimeout(liveSplashTimeout);
        clearStoredLaunchTime();
        launchTimestamp = null;
        currentThemeIndex = 0;
        setScreen("CEREMONY");
        if (ceremonyController) {
          ceremonyController.goToStep(0);
        }
      }
    });
  }
}

/**
 * Main App Initialization
 */
function init() {
  initContent();
  initEventListeners();

  // Initialize Canvas Systems
  if (particleCanvas) {
    particleBg = new ParticleBackground(particleCanvas);
    particleBg.start();
  }

  if (glitterCanvas) {
    glitterEngine = new GlitterEngine(glitterCanvas);
  }

  // Check if hackathon was already launched (e.g. page refreshed during 24 hours)
  if (launchTimestamp) {
    const timeRemaining = get24HourRemaining(launchTimestamp, Date.now(), CONFIG.durationHours);
    if (!timeRemaining.isExpired) {
      setScreen("COUNTDOWN");
      return;
    }
  }

  // Default: Theatrical Auditorium Ceremony Mode (Step 1: Curtain)
  setScreen("CEREMONY");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
