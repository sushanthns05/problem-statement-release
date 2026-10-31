import { CONFIG } from "./config.js";
import {
  getStoredLaunchTime,
  saveLaunchTime,
  clearStoredLaunchTime,
  get24HourRemaining,
  format24HourDisplay,
  formatISTDate,
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
let particleBg = null;
let glitterEngine = null;
let lastAnnouncedMinute = null;
let isRehearsal10s = false;

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
const btnTest10s = document.getElementById("btn-test-10s");
const btnResetCeremony = document.getElementById("btn-reset-ceremony");

const introNumberDisplay = document.getElementById("intro-number-display");
const introSvgProgress = document.getElementById("intro-svg-progress");

const digitHours = document.getElementById("digit-hours");
const digitMinutes = document.getElementById("digit-minutes");
const digitSeconds = document.getElementById("digit-seconds");
const digitCentis = document.getElementById("digit-centis");
const hackathonProgressBar = document.getElementById("hackathon-progress-bar");
const elapsedPercentLabel = document.getElementById("elapsed-percent-label");
const metaStartTime = document.getElementById("meta-start-time");

const milestonesGrid = document.getElementById("milestones-grid");
const srAnnouncer = document.getElementById("sr-countdown-announcer");

const particleCanvas = document.getElementById("particle-canvas");
const glitterCanvas = document.getElementById("glitter-canvas");

/**
 * Initialize Branding & Milestones from CONFIG
 */
function initContent() {
  document.title = `${CONFIG.eventName} | 24-Hour Hackathon Launch Countdown`;

  const deptTitle = document.getElementById("header-dept-title");
  if (deptTitle) deptTitle.textContent = CONFIG.departmentName;

  const collegeTitle = document.getElementById("header-college-title");
  if (collegeTitle) collegeTitle.textContent = `${CONFIG.collegeName}, ${CONFIG.location}`;

  // Render Milestones
  if (milestonesGrid && CONFIG.milestones) {
    milestonesGrid.innerHTML = CONFIG.milestones
      .map(
        (m) => `
      <div class="milestone-card">
        <span class="milestone-badge">${m.badge}</span>
        <div class="milestone-hours">⏰ ${m.hours}</div>
        <div class="milestone-name">${m.title}</div>
        <div class="milestone-desc">${m.desc}</div>
      </div>
    `
      )
      .join("");
  }
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
    headerStatusBadge.classList.add("status-live");
    headerStatusText.textContent = "🔴 LIVE: 24-HR COUNTDOWN";
    headerStatusBadge.setAttribute("aria-label", "Status: 24-Hour Hackathon is Officially Live");
  } else {
    headerStatusBadge.classList.remove("status-live");
    headerStatusText.textContent = "AWAITING INAUGURATION";
    headerStatusBadge.setAttribute("aria-label", "Status: Awaiting Inauguration");
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
 * SCREEN 2: 3-SECOND INAUGURATION COUNTDOWN
 */
function startIntroSequence() {
  let count = 3;
  introNumberDisplay.textContent = count;
  updateSvgRing(count);
  sound.playIntroBeep(count);

  if (introInterval) clearInterval(introInterval);

  introInterval = setInterval(() => {
    count--;

    if (count > 0) {
      introNumberDisplay.textContent = count;
      sound.playIntroBeep(count);

      // Re-trigger zoom animation
      introNumberDisplay.style.animation = "none";
      void introNumberDisplay.offsetWidth;
      introNumberDisplay.style.animation = "numberZoomFade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards";

      updateSvgRing(count);
    } else {
      clearInterval(introInterval);
      introInterval = null;

      // Inaugurate 24-Hour Clock!
      if (!isRehearsal10s) {
        launchTimestamp = saveLaunchTime(Date.now());
      }
      triggerGrandGlitterLaunch();
      setScreen("COUNTDOWN");
    }
  }, 1000);
}

function updateSvgRing(count) {
  if (!introSvgProgress) return;
  const circumference = 2 * Math.PI * 100;
  const offset = circumference * (1 - count / 3);
  introSvgProgress.style.strokeDashoffset = `${offset}`;
}

function skipIntro() {
  if (introInterval) {
    clearInterval(introInterval);
    introInterval = null;
  }
  if (!launchTimestamp) {
    launchTimestamp = saveLaunchTime(Date.now());
  }
  triggerGrandGlitterLaunch();
  setScreen("COUNTDOWN");
}

/**
 * GLITTER EXPLOSION & TRIUMPHANT SOUND
 */
function triggerGrandGlitterLaunch() {
  if (glitterEngine) {
    glitterEngine.explodeGlitter(300);
  }
  sound.playGrandLaunchFanfare();
}

/**
 * SCREEN 3: LIVE 24-HOUR COUNTDOWN ENGINE
 */
function start24HourTimer() {
  if (countdownInterval) clearInterval(countdownInterval);

  if (!launchTimestamp) {
    launchTimestamp = saveLaunchTime(Date.now());
  }

  if (metaStartTime) {
    metaStartTime.textContent = formatISTDate(launchTimestamp);
  }

  const durationHours = isRehearsal10s ? 10 / 3600 : CONFIG.durationHours;

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
  // Principal Launch Button
  btnLaunchNow.addEventListener("click", () => {
    isRehearsal10s = false;
    sound.init(); // Initialize audio context on click
    setScreen("INTRO");
  });

  // Skip Intro
  btnSkipIntro.addEventListener("click", skipIntro);

  // Sound FX Toggle
  btnToggleSound.addEventListener("click", () => {
    const isMuted = sound.toggleMute();
    soundIcon.textContent = isMuted ? "🔇" : "🔊";
    btnToggleSound.setAttribute("title", isMuted ? "Sound is Muted" : "Sound is Active");
  });

  // Fullscreen / Stage Mode Toggle
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

  // Trigger Glitter Button
  btnFireGlitter.addEventListener("click", () => {
    if (glitterEngine) {
      glitterEngine.explodeGlitter(280);
    }
    sound.playGrandLaunchFanfare();
  });

  // 10s Rehearsal Mode
  btnTest10s.addEventListener("click", () => {
    isRehearsal10s = true;
    launchTimestamp = Date.now() - (24 * 3600 * 1000 - 10000);
    saveLaunchTime(launchTimestamp);
    setScreen("COUNTDOWN");
  });

  // Reset Ceremony for Principal Re-launch
  btnResetCeremony.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Reset Hackathon Launch Ceremony back to the Inauguration screen?"
    );
    if (confirmed) {
      if (countdownInterval) clearInterval(countdownInterval);
      clearStoredLaunchTime();
      launchTimestamp = null;
      isRehearsal10s = false;
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
