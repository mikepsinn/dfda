import { readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark, fixedBrandMarkColors } from "@/components/BrandMark";

describe("BrandMark", () => {
  it("is decorative and follows the theme colors by default", () => {
    const { container } = render(<BrandMark className="h-8 w-8" />);
    const svg = container.querySelector("svg")!;

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.getAttribute("width")).toBeNull();
    expect(svg.querySelector("rect")).toHaveAttribute("stroke", "hsl(var(--primary))");
  });

  it("takes fixed colors and a size for images rendered without CSS", () => {
    const { container } = render(<BrandMark colors={fixedBrandMarkColors} size={120} />);
    const svg = container.querySelector("svg")!;

    expect(svg).toHaveAttribute("width", "120");
    expect(svg.querySelector("rect")).toHaveAttribute("stroke", fixedBrandMarkColors.primary);
  });

  it("matches the browser icon drawing", () => {
    // app/icon.svg is the same drawing with fixed colors; this catches one changing without the other.
    const icon = readFileSync(path.join(process.cwd(), "app/icon.svg"), "utf8");
    const { container } = render(<BrandMark colors={fixedBrandMarkColors} />);
    const shapes = (root: ParentNode) =>
      [...root.querySelectorAll("rect, circle, polyline")].map(el =>
        ["x", "y", "width", "height", "cx", "cy", "r", "points"].map(name => el.getAttribute(name)).join(" "),
      );

    expect(shapes(container)).toEqual(shapes(new DOMParser().parseFromString(icon, "image/svg+xml")));
  });
});
