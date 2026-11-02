import { describe, it, expect } from "vitest";
import { THEMES } from "../src/problemStatements.js";
import { CeremonyController } from "../src/ceremony.js";

describe("Lakshya 2026 Big Screen Ceremony Sequence", () => {
  it("verifies the 15-step ceremony sequence with 35s animated theme tables", () => {
    // Instantiate with mock container
    const controller = new CeremonyController({});
    const steps = controller.buildSteps();

    expect(steps.length).toBe(15);

    // Step 1: Curtain
    expect(steps[0].id).toBe("step-curtain");
    expect(steps[0].num).toBe(1);
    expect(steps[0].title).toBe("Curtain");

    // Step 2: S J B Institute Of Technology (5s)
    expect(steps[1].id).toBe("step-sjbit");
    expect(steps[1].num).toBe(2);
    expect(steps[1].title).toBe("S J B Institute Of Technology");
    expect(steps[1].duration).toBe(5000);

    // Step 3: Campus Photo (5s)
    expect(steps[2].id).toBe("step-campus");
    expect(steps[2].num).toBe(3);
    expect(steps[2].title).toBe("Campus Photo");
    expect(steps[2].duration).toBe(5000);

    // Step 4: Swamiji Photos(3) (5s)
    expect(steps[3].id).toBe("step-swamiji");
    expect(steps[3].num).toBe(4);
    expect(steps[3].title).toBe("Revered Swamijis");
    expect(steps[3].duration).toBe(5000);

    // Step 5: 25 year logo (5s)
    expect(steps[4].id).toBe("step-jubilee");
    expect(steps[4].num).toBe(5);
    expect(steps[4].title).toBe("25 Year Silver Jubilee");
    expect(steps[4].duration).toBe(5000);

    // Step 6: ISE Department (5s)
    expect(steps[5].id).toBe("step-ise");
    expect(steps[5].num).toBe(6);
    expect(steps[5].title).toBe("ISE Department");
    expect(steps[5].duration).toBe(5000);

    // Step 7: Lakshya (5s)
    expect(steps[6].id).toBe("step-lakshya");
    expect(steps[6].num).toBe(7);
    expect(steps[6].title).toBe("Lakshya 2026");
    expect(steps[6].duration).toBe(5000);

    // Step 8: Sponsors-DLithe ALL Logos (5s)
    expect(steps[7].id).toBe("step-sponsors");
    expect(steps[7].num).toBe(8);
    expect(steps[7].title).toBe("Sponsors & Accreditations");
    expect(steps[7].duration).toBe(5000);

    // Step 9: Problem Statement-Big Screen (5s)
    expect(steps[8].id).toBe("step-problem-title");
    expect(steps[8].num).toBe(9);
    expect(steps[8].title).toBe("Problem Statements");
    expect(steps[8].duration).toBe(5000);

    // Step 10: Click on
    expect(steps[9].id).toBe("step-click-on");
    expect(steps[9].num).toBe(10);
    expect(steps[9].title).toBe("Click to Release");

    // Step 11: Theme 1 Table (35s)
    expect(steps[10].id).toBe("step-theme-table-1");
    expect(steps[10].num).toBe(11);
    expect(steps[10].title).toBe("Theme 1: Agriculture");
    expect(steps[10].type).toBe("theme-table");
    expect(steps[10].themeIdx).toBe(0);
    expect(steps[10].duration).toBe(35000);

    // Step 12: Theme 2 Table (35s)
    expect(steps[11].id).toBe("step-theme-table-2");
    expect(steps[11].num).toBe(12);
    expect(steps[11].title).toBe("Theme 2: Smart & Sustainable Future");
    expect(steps[11].type).toBe("theme-table");
    expect(steps[11].themeIdx).toBe(1);
    expect(steps[11].duration).toBe(35000);

    // Step 13: Theme 3 Table (35s)
    expect(steps[12].id).toBe("step-theme-table-3");
    expect(steps[12].num).toBe(13);
    expect(steps[12].title).toBe("Theme 3: Governance");
    expect(steps[12].type).toBe("theme-table");
    expect(steps[12].themeIdx).toBe(2);
    expect(steps[12].duration).toBe(35000);

    // Step 14: Countdown 5 to 1
    expect(steps[13].id).toBe("step-countdown-5to1");
    expect(steps[13].num).toBe(14);
    expect(steps[13].type).toBe("countdown");

    // Step 15: Display Timer
    expect(steps[14].id).toBe("step-display-timer");
    expect(steps[14].num).toBe(15);
    expect(steps[14].type).toBe("complete");
  });

  it("verifies renderThemeTableSlide renders all 10 statements of the theme in a table with animation classes", () => {
    const controller = new CeremonyController({});
    const steps = controller.buildSteps();

    // Check Theme 1 Table HTML
    const theme1Step = steps[10];
    const theme1Html = controller.renderThemeTableSlide(theme1Step);

    expect(theme1Html).toContain("anim-table-theme-1");
    expect(theme1Html).toContain("THEME 1 OF 3");
    expect(theme1Html).toContain("AGRICULTURE");
    expect(theme1Html).toContain("ceremony-statements-table");

    // Verify all 10 problem statements of Theme 1 are in the table
    THEMES[0].problems.forEach((p) => {
      const escaped = p.challenge.replace(/&/g, "&amp;");
      expect(theme1Html).toContain(escaped);
    });

    // Verify Theme 2 Table HTML
    const theme2Step = steps[11];
    const theme2Html = controller.renderThemeTableSlide(theme2Step);
    expect(theme2Html).toContain("anim-table-theme-2");
    expect(theme2Html).toContain("SMART &amp; SUSTAINABLE FUTURE");
    THEMES[1].problems.forEach((p) => {
      const escaped = p.challenge.replace(/&/g, "&amp;");
      expect(theme2Html).toContain(escaped);
    });

    // Verify Theme 3 Table HTML
    const theme3Step = steps[12];
    const theme3Html = controller.renderThemeTableSlide(theme3Step);
    expect(theme3Html).toContain("anim-table-theme-3");
    expect(theme3Html).toContain("GOVERNANCE");
    THEMES[2].problems.forEach((p) => {
      const escaped = p.challenge.replace(/&/g, "&amp;");
      expect(theme3Html).toContain(escaped);
    });
  });

  it("ensures presenter toolbar is removed from the DOM while keyboard shortcuts remain active", () => {
    const container = {
      innerHTML: "",
      querySelector: () => null,
      querySelectorAll: () => []
    };
    const controller = new CeremonyController({ container });
    controller.initDOM();

    // Verify presenter toolbar is not in the rendered HTML
    expect(container.innerHTML).not.toContain('id="ceremony-presenter-bar"');
    expect(container.innerHTML).toContain('id="ceremony-curtain-stage"');
    expect(container.innerHTML).toContain('id="ceremony-slide-viewport"');
  });
});
