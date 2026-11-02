import { describe, it, expect } from "vitest";
import { THEMES } from "../src/problemStatements.js";

describe("Lakshya 2026 Problem Statements Theme Structure", () => {
  it("contains exactly 3 hackathon themes", () => {
    expect(THEMES.length).toBe(3);
    expect(THEMES[0].name).toBe("Agriculture");
    expect(THEMES[1].name).toBe("Smart & Sustainable Future");
    expect(THEMES[2].name).toBe("Governance");
  });

  it("each theme has exactly 10 problem statements (30 total)", () => {
    THEMES.forEach((theme) => {
      expect(theme.problems.length).toBe(10);
    });
    const totalCount = THEMES.reduce((sum, t) => sum + t.problems.length, 0);
    expect(totalCount).toBe(30);
  });

  it("verifies Theme 1: Agriculture problem IDs and serial numbers (1 to 10)", () => {
    const agr = THEMES[0];
    expect(agr.problems[0].slNo).toBe(1);
    expect(agr.problems[0].id).toBe("DL-SJBIT-HK26-AGR001");
    expect(agr.problems[0].challenge).toBe("Crop Disease & Pest Identification");

    expect(agr.problems[9].slNo).toBe(10);
    expect(agr.problems[9].id).toBe("DL-SJBIT-HK26-AGR010");
    expect(agr.problems[9].challenge).toBe("A Digital Assistant for Small Farmers");

    agr.problems.forEach((p, idx) => {
      expect(p.slNo).toBe(idx + 1);
      expect(p.id).toBe(`DL-SJBIT-HK26-AGR${String(idx + 1).padStart(3, "0")}`);
      expect(p.challenge.length).toBeGreaterThan(5);
    });
  });

  it("verifies Theme 2: Smart & Sustainable Future problem IDs and serial numbers (11 to 20)", () => {
    const ssf = THEMES[1];
    expect(ssf.problems[0].slNo).toBe(11);
    expect(ssf.problems[0].id).toBe("DL-SJBIT-HK26-SSF001");
    expect(ssf.problems[0].challenge).toBe("AI-Powered Smart Waste Management");

    expect(ssf.problems[9].slNo).toBe(20);
    expect(ssf.problems[9].id).toBe("DL-SJBIT-HK26-SSF010");
    expect(ssf.problems[9].challenge).toBe("Empowering traveling doctors with AI");

    ssf.problems.forEach((p, idx) => {
      expect(p.slNo).toBe(idx + 11);
      expect(p.id).toBe(`DL-SJBIT-HK26-SSF${String(idx + 1).padStart(3, "0")}`);
      expect(p.challenge.length).toBeGreaterThan(5);
    });
  });

  it("verifies Theme 3: Governance problem IDs and serial numbers (21 to 30)", () => {
    const gov = THEMES[2];
    expect(gov.problems[0].slNo).toBe(21);
    expect(gov.problems[0].id).toBe("DL-SJBIT-HK26-GOVP001");
    expect(gov.problems[0].challenge).toBe("Intelligent Energy Ecosystem & Dynamic Taxation");

    expect(gov.problems[9].slNo).toBe(30);
    expect(gov.problems[9].id).toBe("DL-SJBIT-HK26-GOVP010");
    expect(gov.problems[9].challenge).toBe("Dairy Plant Energy Consumption, Hygiene & Waste Tracking");

    gov.problems.forEach((p, idx) => {
      expect(p.slNo).toBe(idx + 21);
      expect(p.id).toBe(`DL-SJBIT-HK26-GOVP${String(idx + 1).padStart(3, "0")}`);
      expect(p.challenge.length).toBeGreaterThan(5);
    });
  });
});
