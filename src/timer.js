/**
 * 24-Hour Hackathon Timer Engine
 * Computes exact remaining time from the moment the Principal launches,
 * persists in localStorage so browser refreshes stay in sync,
 * and handles 100% accurate countdown against Date.now().
 */

export const STORAGE_KEY_LAUNCH = "lakshya_24h_launch_time";

/**
 * Get stored launch timestamp or null
 */
export function getStoredLaunchTime() {
  try {
    const val = localStorage.getItem(STORAGE_KEY_LAUNCH);
    if (!val) return null;
    const num = parseInt(val, 10);
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
}

/**
 * Save launch timestamp to localStorage
 */
export function saveLaunchTime(timestamp = Date.now()) {
  try {
    localStorage.setItem(STORAGE_KEY_LAUNCH, String(timestamp));
  } catch (err) {
    console.warn("Could not save to localStorage", err);
  }
  return timestamp;
}

/**
 * Clear stored launch time (for rehearsal / reset)
 */
export function clearStoredLaunchTime() {
  try {
    localStorage.removeItem(STORAGE_KEY_LAUNCH);
  } catch (err) {
    console.warn("Could not clear localStorage", err);
  }
}

/**
 * Compute the remaining time in the 24-hour countdown
 * @param {number} launchMs Epoch ms when Principal launched
 * @param {number} nowMs Current epoch ms
 * @param {number} durationHours Total hackathon duration (default: 24)
 */
export function get24HourRemaining(launchMs, nowMs = Date.now(), durationHours = 24) {
  const totalDurationMs = durationHours * 3600 * 1000;
  const targetEndMs = launchMs + totalDurationMs;
  const diffMs = targetEndMs - nowMs;

  if (diffMs <= 0) {
    return {
      totalMs: 0,
      isExpired: true,
      hours: 0,
      minutes: 0,
      seconds: 0,
      centis: 0,
      elapsedPercent: 100,
    };
  }

  const elapsedMs = Math.max(0, nowMs - launchMs);
  const elapsedPercent = Math.min(100, (elapsedMs / totalDurationMs) * 100);

  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const centis = Math.floor((diffMs % 1000) / 10);

  return {
    totalMs: diffMs,
    isExpired: false,
    hours,
    minutes,
    seconds,
    centis,
    elapsedPercent,
  };
}

export function formatTwoDigits(val) {
  return String(Math.max(0, Math.floor(val))).padStart(2, "0");
}

export function format24HourDisplay(timeObj) {
  const hoursStr = formatTwoDigits(timeObj.hours);
  const minutesStr = formatTwoDigits(timeObj.minutes);
  const secondsStr = formatTwoDigits(timeObj.seconds);
  const centisStr = formatTwoDigits(timeObj.centis);

  const fullFormatted = `${hoursStr}:${minutesStr}:${secondsStr}`;

  return {
    hoursStr,
    minutesStr,
    secondsStr,
    centisStr,
    fullFormatted,
  };
}

export function formatISTDate(dateInput) {
  const date = typeof dateInput === "number" ? new Date(dateInput) : new Date(dateInput);
  if (isNaN(date.getTime())) return "Invalid Date";

  const options = {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  const formatter = new Intl.DateTimeFormat("en-IN", options);
  return `${formatter.format(date)} IST`;
}

export function shouldAnnounceToScreenReader(prevMinutes, currentMinutes, isExpired) {
  if (isExpired) return true;
  if (prevMinutes === null || prevMinutes === undefined) return true;
  return prevMinutes !== currentMinutes;
}
