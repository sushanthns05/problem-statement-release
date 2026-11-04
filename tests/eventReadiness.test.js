import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { THEMES } from "../src/problemStatements.js";
import { CeremonyController } from "../src/ceremony.js";
import {
  get24HourRemaining,
  format24HourDisplay,
  formatTwoDigits,
  shouldAnnounceToScreenReader,
} from "../src/timer.js";
import { sound } from "../src/audio.js";

describe("Lakshya 2026 Event Readiness & Zero-Glitch Verification", () => {
  it("verifies all 30 problem statements across all 3 themes are valid and complete", () => {
    expect(THEMES.length).toBe(3);

    const themeNames = ["Agriculture", "Smart & Sustainable Future", "Governance"];
    let totalProblems = 0;
    const seenIds = new Set();
    const seenChallenges = new Set();

    THEMES.forEach((theme, tIdx) => {
      expect(theme.name).toBe(themeNames[tIdx]);
      expect(theme.problems.length).toBe(10);
      expect(theme.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.icon).toBeTruthy();
      expect(theme.summary).toBeTruthy();

      theme.problems.forEach((p, pIdx) => {
        totalProblems++;
        expect(p.slNo).toBe(totalProblems);
        expect(p.id).toBeTruthy();
        expect(seenIds.has(p.id)).toBe(false);
        seenIds.add(p.id);

        expect(p.challenge).toBeTruthy();
        expect(p.challenge.trim().length).toBeGreaterThan(5);
        expect(seenChallenges.has(p.challenge)).toBe(false);
        seenChallenges.add(p.challenge);
      });
    });

    expect(totalProblems).toBe(30);
  });

  it("verifies all 18 ceremony steps with correct sequence and timing", () => {
    const controller = new CeremonyController({});
    const steps = controller.buildSteps();
    expect(steps.length).toBe(18);

    // Step 1: Curtain
    expect(steps[0].id).toBe("step-curtain");
    expect(steps[0].type).toBe("curtain");
    expect(steps[0].autoAdvance).toBe(false);

    // Step 2 to 9: Intro slides (4s each)
    for (let i = 1; i <= 8; i++) {
      expect(steps[i].duration).toBe(4000);
    }

    // Step 8: Sponsors
    expect(steps[7].id).toBe("step-sponsors");
    expect(steps[7].type).toBe("sponsors");

    // Step 10: Click to Release
    expect(steps[9].id).toBe("step-click-on");
    expect(steps[9].autoAdvance).toBe(false);

    // Theme bigscreens & tables
    expect(steps[10].type).toBe("theme-intro");
    expect(steps[10].themeIdx).toBe(0);
    expect(steps[11].type).toBe("theme-table");
    expect(steps[11].themeIdx).toBe(0);
    expect(steps[11].duration).toBe(5000);

    expect(steps[12].type).toBe("theme-intro");
    expect(steps[12].themeIdx).toBe(1);
    expect(steps[13].type).toBe("theme-table");
    expect(steps[13].themeIdx).toBe(1);
    expect(steps[13].duration).toBe(5000);

    expect(steps[14].type).toBe("theme-intro");
    expect(steps[14].themeIdx).toBe(2);
    expect(steps[15].type).toBe("theme-table");
    expect(steps[15].themeIdx).toBe(2);
    expect(steps[15].duration).toBe(5000);

    // Step 17: Countdown 5 to 1
    expect(steps[16].id).toBe("step-countdown-5to1");
    expect(steps[16].type).toBe("countdown");

    // Step 18: Display Timer
    expect(steps[17].id).toBe("step-display-timer");
    expect(steps[17].type).toBe("complete");
  });

  it("verifies timer math precision and edge cases", () => {
    const launch = 1000000;
    const nowStart = launch;
    const remStart = get24HourRemaining(launch, nowStart, 24);
    expect(remStart.hours).toBe(24);
    expect(remStart.minutes).toBe(0);
    expect(remStart.seconds).toBe(0);
    expect(remStart.isExpired).toBe(false);
    expect(remStart.elapsedPercent).toBe(0);

    const nowMid = launch + 12 * 3600 * 1000;
    const remMid = get24HourRemaining(launch, nowMid, 24);
    expect(remMid.hours).toBe(12);
    expect(remMid.minutes).toBe(0);
    expect(remMid.seconds).toBe(0);
    expect(remMid.elapsedPercent).toBe(50);

    const nowExpired = launch + 25 * 3600 * 1000;
    const remExp = get24HourRemaining(launch, nowExpired, 24);
    expect(remExp.isExpired).toBe(true);
    expect(remExp.hours).toBe(0);
    expect(remExp.minutes).toBe(0);
    expect(remExp.seconds).toBe(0);
    expect(remExp.elapsedPercent).toBe(100);

    const formatted = format24HourDisplay(remMid);
    expect(formatted.hoursStr).toBe("12");
    expect(formatted.minutesStr).toBe("00");
    expect(formatted.secondsStr).toBe("00");
    expect(formatted.centisStr).toBe("00");
  });

  it("verifies all critical static assets exist in dist/assets", () => {
    const criticalAssets = [
      "countdown.mp4",
      "countdown.wav",
      "audio.mpeg",
      "audio.mp3",
      "divine-design-seal-clean.png",
      "divine-design-seal-gold.png",
      "dlithe-logo-clean.png",
      "printasstic-transparent.png",
      "accreditations-logos-blended.png",
      "sjbit-campus-hd.jpg",
      "sjbit-silver-jubilee-2026-hd.png",
      "lakshya-mountain-logo.png",
      "ise-dept-logo-clean.png",
      "sjbit-orange-seal-circle.png",
      "dignitary-nirmalanandanatha-clean.png",
      "dignitary-prakashnath-clean.png",
      "dignitary-trustee-clean.png",
    ];

    criticalAssets.forEach((assetName) => {
      const assetPath = path.resolve("dist", "assets", assetName);
      expect(fs.existsSync(assetPath)).toBe(true);
      const stat = fs.statSync(assetPath);
      expect(stat.size).toBeGreaterThan(1000); // not empty or corrupt
    });
  });

  it("verifies index.html contains all critical DOM elements", () => {
    const html = fs.readFileSync(path.resolve("index.html"), "utf-8");

    const requiredIds = [
      "screen-ceremony",
      "screen-landing",
      "screen-intro",
      "screen-problems",
      "screen-countdown",
      "digit-hours",
      "digit-minutes",
      "digit-seconds",
      "digit-centis",
      "hackathon-progress-bar",
      "btn-launch-now",
      "btn-view-problems",
      "btn-replay-ceremony",
      "btn-prev-theme",
      "btn-next-theme",
      "theme-index-badge",
      "problems-table-body",
    ];

    requiredIds.forEach((id) => {
      expect(html.includes(`id="${id}"`)).toBe(true);
    });

    // Check preloaded assets in HTML
    expect(html.includes('rel="preload" href="/assets/countdown.mp4"')).toBe(true);
    expect(html.includes('rel="preload" href="/assets/divine-design-seal-clean.png"')).toBe(true);
    expect(html.includes('rel="preload" href="/assets/dlithe-logo-clean.png"')).toBe(true);
    expect(html.includes('rel="preload" href="/assets/printasstic-transparent.png"')).toBe(true);
  });

  it("verifies sound engine functions run without unhandled errors", () => {
    expect(typeof sound.playIntroBeep).toBe("function");
    expect(typeof sound.playGrandLaunchFanfare).toBe("function");
    expect(typeof sound.playRevealChime).toBe("function");
    expect(typeof sound.playThemeTransition).toBe("function");
    expect(typeof sound.playCurtainOpen).toBe("function");
    expect(typeof sound.startCountdownBgm).toBe("function");
    expect(typeof sound.stopCountdownBgm).toBe("function");
    expect(typeof sound.startCeremonyBgm).toBe("function");
    expect(typeof sound.stopCeremonyBgm).toBe("function");
    expect(typeof sound.toggleMute).toBe("function");

    // Test mute toggle
    const initialMute = sound.muted;
    sound.toggleMute();
    expect(sound.muted).toBe(!initialMute);
    sound.toggleMute();
    expect(sound.muted).toBe(initialMute);

    // Calling sound functions in node environment should not throw
    expect(() => sound.playThemeTransition()).not.toThrow();
    expect(() => sound.stopCeremonyBgm(0.1)).not.toThrow();
    expect(() => sound.stopCountdownBgm(0.1)).not.toThrow();
  });
});
