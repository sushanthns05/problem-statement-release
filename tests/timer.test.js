import { describe, it, expect } from "vitest";
import {
  get24HourRemaining,
  formatTwoDigits,
  format24HourDisplay,
  formatISTDate,
  shouldAnnounceToScreenReader,
} from "../src/timer.js";

describe("24-Hour Hackathon Timer Calculations", () => {
  it("initializes with exactly 24 hours remaining at launch moment", () => {
    const launchTime = 1700000000000;
    const res = get24HourRemaining(launchTime, launchTime, 24);

    expect(res.isExpired).toBe(false);
    expect(res.hours).toBe(24);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(0);
    expect(res.elapsedPercent).toBe(0);
  });

  it("calculates remaining time accurately after 1 hour of hacking", () => {
    const launchTime = 1700000000000;
    const oneHourLater = launchTime + 1 * 3600 * 1000; // 1 hr elapsed
    const res = get24HourRemaining(launchTime, oneHourLater, 24);

    expect(res.isExpired).toBe(false);
    expect(res.hours).toBe(23);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(0);
    expect(res.elapsedPercent).toBeCloseTo(4.166, 1);
  });

  it("calculates remaining time when 10 seconds remain", () => {
    const launchTime = 1700000000000;
    const almostDone = launchTime + (24 * 3600 - 10) * 1000 + 400;
    const res = get24HourRemaining(launchTime, almostDone, 24);

    expect(res.isExpired).toBe(false);
    expect(res.hours).toBe(0);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(9);
    expect(res.centis).toBe(60);
  });

  it("marks isExpired true when 24 hours elapsed", () => {
    const launchTime = 1700000000000;
    const ended = launchTime + 24 * 3600 * 1000 + 1000;
    const res = get24HourRemaining(launchTime, ended, 24);

    expect(res.isExpired).toBe(true);
    expect(res.hours).toBe(0);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(0);
    expect(res.elapsedPercent).toBe(100);
  });
});

describe("24-Hour Display Formatting", () => {
  it("pads single digits with zero", () => {
    expect(formatTwoDigits(0)).toBe("00");
    expect(formatTwoDigits(5)).toBe("05");
    expect(formatTwoDigits(23)).toBe("23");
  });

  it("formats 24-hour display object", () => {
    const timeObj = { hours: 23, minutes: 45, seconds: 12, centis: 84 };
    const display = format24HourDisplay(timeObj);

    expect(display.hoursStr).toBe("23");
    expect(display.minutesStr).toBe("45");
    expect(display.secondsStr).toBe("12");
    expect(display.centisStr).toBe("84");
    expect(display.fullFormatted).toBe("23:45:12");
  });

  it("formats IST timestamp correctly", () => {
    const ts = Date.UTC(2026, 10, 5, 4, 30, 0); // 10:00 AM IST
    const istStr = formatISTDate(ts);

    expect(istStr).toContain("IST");
    expect(istStr).toContain("Nov");
    expect(istStr).toContain("2026");
  });
});

describe("Screen Reader Announcer Throttling", () => {
  it("announces initially when prevMinutes is null", () => {
    expect(shouldAnnounceToScreenReader(null, 59, false)).toBe(true);
  });

  it("suppresses repeating announcements during same minute", () => {
    expect(shouldAnnounceToScreenReader(59, 59, false)).toBe(false);
  });

  it("announces on minute rollover", () => {
    expect(shouldAnnounceToScreenReader(59, 58, false)).toBe(true);
  });

  it("announces when expired", () => {
    expect(shouldAnnounceToScreenReader(0, 0, true)).toBe(true);
  });
});
