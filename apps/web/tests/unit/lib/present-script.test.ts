import { describe, expect, it } from "vitest";
import { loadScript, parseScript } from "@/lib/present/script";

describe("presentation script", () => {
  const slides = loadScript("patient-journey");

  it("reads every main and backup slide in order", () => {
    expect(slides.map(s => s.key)).toEqual([
      ...Array.from({ length: 19 }, (_, i) => String(i + 1)), "B1", "B2", "B3",
    ]);
    for (const slide of slides) {
      expect(slide.purpose, slide.key).toBeTruthy();
      expect(slide.notes, slide.key).toBeTruthy();
      expect(slide.visual, slide.key).toBeTruthy();
    }
  });

  it("takes labeled on-screen text, notes and sources without markdown", () => {
    const [title, margaret] = slides;
    expect(title.eyebrow).toBe("THE CARE-INTEGRATED CLINICAL TRIALS INITIATIVE");
    expect(title.title).toBe("Every patient's treatment can help the next patient");
    expect(title.subtitle).toMatch(/^Radically accelerating medical discovery/);
    expect(margaret.sourceLine).toBe(
      "Frontiers in Pharmacology, 2023, ten-year review of drug repurposing for Alzheimer's.");
    expect(slides.find(s => s.key === "19")!.title).toBe("Every patient's experience becomes evidence for the next.");
    expect(slides.find(s => s.key === "11")!.narration).toMatch(/^Her own doctor recommends one/);
    // The last main slide stops at the "Backup slides" heading.
    expect(slides.find(s => s.key === "19")!.narration).not.toMatch(/Backup/);
    expect(slides.find(s => s.key === "8")!.visual).not.toMatch(/`/);
  });

  it("joins wrapped bullets and ignores sections that are not slides", () => {
    const parsed = parseScript([
      "# Deck", "", "## Brief", "", "- not a slide", "", "## 1. One", "", "**Purpose:** Why.", "",
      "**On screen**", "", "- Title: A long", "  title", "- Other", "", "**Speaker notes:** First", "line.", "",
      "---", "", "# Backup slides", "", "## B1. Extra", "", "**Speaker notes:** More.",
    ].join("\r\n"));
    expect(parsed).toEqual([
      { key: "1", heading: "One", onScreen: ["Title: A long title", "Other"], title: "A long title",
        purpose: "Why.", notes: "First line." },
      { key: "B1", heading: "Extra", onScreen: [], notes: "More." },
    ]);
  });
});
