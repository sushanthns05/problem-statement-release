import { CONFIG } from "./config.js";
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

/**
 * ====================================================================
 * APPLICATION CONTROLLER
 * ====================================================================
 */

// State
let currentScreen = "LANDING";
let launchTimestamp = getStoredLaunchTime();
let countdownInterval = null;
let introInterval = null;
let liveSplashTimeout = null;
let particleBg = null;
let glitterEngine = null;
let lastAnnouncedMinute = null;

// DOM Elements
const screenLanding = document.getElementById("screen-landing");
const screenIntro = document.getElementById("screen-intro");
const screenCountdown = document.getElementById("screen-countdown");

const headerStatusBadge = document.getElementById("header-status-badge");
const headerStatusText = document.getElementById("header-status-text");

const btnLaunchNow = document.getElementById("btn-launch-now");
const btnSkipIntro = document.getElementById("btn-skip-intro");
const btnToggleSound = document.getElementById("btn-toggle-sound");
const soundIcon = document.getElementById("sound-icon");
const btnToggleFullscreen = document.getElementById("btn-toggle-fullscreen");

const btnFireGlitter = document.getElementById("btn-fire-glitter");
const btnResetCeremony = document.getElementById("btn-reset-ceremony");

const introCountdownBox = document.getElementById("intro-countdown-box");
const introLiveSplash = document.getElementById("intro-live-splash");
const introNumberDisplay = document.getElementById("intro-number-display");
const introLabelDisplay = document.getElementById("intro-label-display");
const introSvgProgress = document.getElementById("intro-svg-progress");

const digitHours = document.getElementById("digit-hours");
const digitMinutes = document.getElementById("digit-minutes");
const digitSeconds = document.getElementById("digit-seconds");
const digitCentis = document.getElementById("digit-centis");
const hackathonProgressBar = document.getElementById("hackathon-progress-bar");
const elapsedPercentLabel = document.getElementById("elapsed-percent-label");

const srAnnouncer = document.getElementById("sr-countdown-announcer");
const particleCanvas = document.getElementById("particle-canvas");
const glitterCanvas = document.getElementById("glitter-canvas");

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
 * @param {'LANDING' | 'INTRO' | 'COUNTDOWN'} targetState
 */
export function setScreen(targetState) {
  currentScreen = targetState;

  screenLanding.classList.remove("active");
  screenIntro.classList.remove("active");
  screenCountdown.classList.remove("active");

  if (targetState === "COUNTDOWN") {
    if (headerStatusText) headerStatusText.textContent = "🔴 LIVE: 24-HR COUNTDOWN";
    if (headerStatusBadge) {
      headerStatusBadge.classList.add("status-live");
      headerStatusBadge.setAttribute("aria-label", "Status: 24-Hour Hackathon is Officially Live");
    }
  } else {
    if (headerStatusText) headerStatusText.textContent = "AWAITING INAUGURATION";
    if (headerStatusBadge) {
      headerStatusBadge.classList.remove("status-live");
      headerStatusBadge.setAttribute("aria-label", "Status: Awaiting Inauguration");
    }
  }

  switch (targetState) {
    case "LANDING":
      screenLanding.classList.add("active");
      if (particleBg) particleBg.start();
      break;

    case "INTRO":
      screenIntro.classList.add("active");
      startIntroSequence();
      break;

    case "COUNTDOWN":
      screenCountdown.classList.add("active");
      if (particleBg) particleBg.start();
      start24HourTimer();
      break;
  }
}

/**
 * SCREEN 2: 3-2-1 INAUGURATION SEQUENCE (GET -> SET -> GO -> LIVE!)
 */
function startIntroSequence() {
  // Reset overlay elements
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

      // 3-2-1 is complete! Show LIVE Message + Glitter explosion!
      showLiveSplashMessage();
    }
  }, 1000);
}

function updateIntroStep(count) {
  const labels = {
    3: "GET",
    2: "SET",
    1: "GO!",
  };

  introNumberDisplay.textContent = count;
  introLabelDisplay.textContent = labels[count] || "";

  sound.playIntroBeep(count);

  // Re-trigger zoom animations
  introNumberDisplay.style.animation = "none";
  introLabelDisplay.style.animation = "none";
  void introNumberDisplay.offsetWidth; // Reflow
  introNumberDisplay.style.animation = "numberZoomFade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards";
  introLabelDisplay.style.animation = "actionWordPop 1s cubic-bezier(0.16, 1, 0.3, 1) forwards";

  updateSvgRing(count);
}

function updateSvgRing(count) {
  if (!introSvgProgress) return;
  const circumference = 2 * Math.PI * 100;
  const offset = circumference * (1 - count / 3);
  introSvgProgress.style.strokeDashoffset = `${offset}`;
}

/**
 * DISPLAY "WE ARE LIVE!" MESSAGE + GLITTER EXPLOSION
 */
function showLiveSplashMessage() {
  // Hide 3-2-1 circle, reveal grand LIVE Splash
  if (introCountdownBox) introCountdownBox.style.display = "none";
  if (introLiveSplash) introLiveSplash.style.display = "flex";

  // Save the official launch timestamp
  launchTimestamp = saveLaunchTime(Date.now());

  // Trigger dense glitter explosion
  if (glitterEngine) {
    glitterEngine.explodeGlitter(350);
  }

  // Triumphant ceremonial fanfare
  sound.playGrandLaunchFanfare();

  // Update header status immediately to LIVE
  headerStatusBadge.classList.add("status-live");
  headerStatusText.textContent = "🔴 LIVE: 24-HR COUNTDOWN";

  // Hold the LIVE Message for 1.8 seconds, then transition to 24-Hour Timer
  liveSplashTimeout = setTimeout(() => {
    setScreen("COUNTDOWN");
  }, 1800);
}

function skipIntro() {
  if (introInterval) {
    clearInterval(introInterval);
    introInterval = null;
  }
  if (liveSplashTimeout) {
    clearTimeout(liveSplashTimeout);
    liveSplashTimeout = null;
  }
  showLiveSplashMessage();
}

/**
 * SCREEN 3: LIVE 24-HOUR COUNTDOWN ENGINE
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
      headerStatusText.textContent = "⏱ TIME COMPLETED";
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
  });

  // Principal Launch Button
  if (btnLaunchNow) {
    btnLaunchNow.addEventListener("click", () => {
      sound.init(); // Initialize Web Audio API on click gesture
      setScreen("INTRO");
    });
  }

  // Skip Intro
  if (btnSkipIntro) {
    btnSkipIntro.addEventListener("click", skipIntro);
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
  btnFireGlitter.addEventListener("click", () => {
    if (glitterEngine) {
      glitterEngine.explodeGlitter(300);
    }
    sound.playGrandLaunchFanfare();
  });

  // Reset Ceremony for Principal Re-launch
  btnResetCeremony.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Reset Hackathon Launch Ceremony back to the Inauguration screen?"
    );
    if (confirmed) {
      if (countdownInterval) clearInterval(countdownInterval);
      if (liveSplashTimeout) clearTimeout(liveSplashTimeout);
      clearStoredLaunchTime();
      launchTimestamp = null;
      setScreen("LANDING");
    }
  });
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

  // Default: Inauguration Landing Screen
  setScreen("LANDING");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
