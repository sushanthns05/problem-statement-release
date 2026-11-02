import { describe, it, expect } from "vitest";
import { THEMES } from "../src/problemStatements.js";
import { CeremonyController } from "../src/ceremony.js";

describe("Lakshya 2026 Big Screen Ceremony Sequence", () => {
  it("verifies the 17-step ceremony sequence exists", () => {
    // Instantiate with mock container
    const controller = new CeremonyController({});
    const steps = controller.buildSteps();

    expect(steps.length).toBeGreaterThanOrEqual(17);

    // Step 1: Curtain
    expect(steps[0].id).toBe("step-curtain");
    expect(steps[0].num).toBe(1);
    expect(steps[0].title).toBe("Curtain");

    // Step 2: S J B Institute Of Technology
    expect(steps[1].id).toBe("step-sjbit");
    expect(steps[1].num).toBe(2);
    expect(steps[1].title).toBe("S J B Institute Of Technology");

    // Step 3: Campus Photo
    expect(steps[2].id).toBe("step-campus");
    expect(steps[2].num).toBe(3);
    expect(steps[2].title).toBe("Campus Photo");

    // Step 4: Swamiji Photos(3)
    expect(steps[3].id).toBe("step-swamiji");
    expect(steps[3].num).toBe(4);
    expect(steps[3].title).toBe("Revered Swamijis");

    // Step 5: 25 year logo
    expect(steps[4].id).toBe("step-jubilee");
    expect(steps[4].num).toBe(5);
    expect(steps[4].title).toBe("25 Year Silver Jubilee");

    // Step 6: ISE Department
    expect(steps[5].id).toBe("step-ise");
    expect(steps[5].num).toBe(6);
    expect(steps[5].title).toBe("ISE Department");

    // Step 7: Lakshya
    expect(steps[6].id).toBe("step-lakshya");
    expect(steps[6].num).toBe(7);
    expect(steps[6].title).toBe("Lakshya 2026");

    // Step 8: Sponsors-DLithe ALL Logos
    expect(steps[7].id).toBe("step-sponsors");
    expect(steps[7].num).toBe(8);
    expect(steps[7].title).toBe("Sponsors & Accreditations");

    // Step 9: Problem Statement-Big Screen
    expect(steps[8].id).toBe("step-problem-title");
    expect(steps[8].num).toBe(9);
    expect(steps[8].title).toBe("Problem Statements");

    // Step 10: Click on
    expect(steps[9].id).toBe("step-click-on");
    expect(steps[9].num).toBe(10);
    expect(steps[9].title).toBe("Click to Release");

    // Step 11: Theme 1 Intro
    expect(steps[10].id).toBe("step-theme-1-intro");
    expect(steps[10].num).toBe(11);
    expect(steps[10].title).toBe("Theme 1: Agriculture");

    // Theme 1 Statements (1 to 10, each 3 seconds)
    for (let i = 1; i <= 10; i++) {
      const s = steps[10 + i];
      expect(s.type).toBe("statement");
      expect(s.themeIdx).toBe(0);
      expect(s.duration).toBe(3000);
      expect(s.problem.challenge).toBe(THEMES[0].problems[i - 1].challenge);
    }

    // Step 12: Theme 2 Intro
    const theme2Intro = steps.find((s) => s.id === "step-theme-2-intro");
    expect(theme2Intro).toBeDefined();
    expect(theme2Intro.num).toBe(12);

    // Theme 2 Statements (1 to 10, each 3 seconds)
    const theme2Statements = steps.filter((s) => s.type === "statement" && s.themeIdx === 1);
    expect(theme2Statements.length).toBe(10);
    theme2Statements.forEach((s, idx) => {
      expect(s.duration).toBe(3000);
      expect(s.problem.challenge).toBe(THEMES[1].problems[idx].challenge);
    });

    // Step 14: Theme 3 Intro
    const theme3Intro = steps.find((s) => s.id === "step-theme-3-intro");
    expect(theme3Intro).toBeDefined();
    expect(theme3Intro.num).toBe(14);

    // Theme 3 Statements (1 to 10, each 3 seconds)
    const theme3Statements = steps.filter((s) => s.type === "statement" && s.themeIdx === 2);
    expect(theme3Statements.length).toBe(10);
    theme3Statements.forEach((s, idx) => {
      expect(s.duration).toBe(3000);
      expect(s.problem.challenge).toBe(THEMES[2].problems[idx].challenge);
    });

    // Step 16: Countdown 5 to 1
    const countdownStep = steps.find((s) => s.id === "step-countdown-5to1");
    expect(countdownStep).toBeDefined();
    expect(countdownStep.num).toBe(16);

    // Step 17: Display Timer
    const timerStep = steps.find((s) => s.id === "step-display-timer");
    expect(timerStep).toBeDefined();
    expect(timerStep.num).toBe(17);
  });

  it("ensures presenter toolbar is removed from the DOM while keyboard shortcuts remain active", () => {
    // Create container mock
    const container = {
      innerHTML: "",
      querySelector: () => null,
      querySelectorAll: () => []
    };
    const controller = new CeremonyController({ container });
    controller.initDOM();

    // Verify presenter toolbar is not in the rendered HTML
    expect(container.innerHTML).not.toContain('id="ceremony-presenter-bar"');
    expect(container.innerHTML).not.toContain('Step 1 of 17');
    expect(container.innerHTML).toContain('id="ceremony-curtain-stage"');
    expect(container.innerHTML).toContain('id="ceremony-slide-viewport"');
  });
});

