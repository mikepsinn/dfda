import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { SearchModal } from "@/components/SearchModal";

// vi.mock calls are hoisted above the imports.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/actions/search", () => ({
  searchVariablesAction: vi.fn(async () => [
    { id: "1", name: "Insomnia", href: "/conditions/1", category: "Global Variables", variableCategoryId: "health-and-physiology", kind: "condition" },
    { id: "2", name: "Melatonin", href: "/treatments/2", category: "My Variables", variableCategoryId: "intake-and-interventions", kind: "treatment" },
    { id: "4", name: "Blood Pressure", href: "/conditions/4", category: "Global Variables", variableCategoryId: "health-and-physiology" },
    { id: "3", name: "Walking", href: "/variables/3", category: "Global Variables", variableCategoryId: "activity-and-behavior" },
  ]),
}));

const originalScroll = Element.prototype.scrollIntoView;
beforeAll(() => {
  // JSDOM has no layout engine; cmdk uses these browser APIs to size/scroll its list.
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
afterAll(() => {
  vi.unstubAllGlobals();
  Element.prototype.scrollIntoView = originalScroll;
});

describe("site search", () => {
  it("says what it searches and labels results in plain words", async () => {
    render(<SearchModal isOpen onClose={() => {}} user={null} />);
    expect(screen.getByPlaceholderText("Search treatments, conditions and more...")).toBeInTheDocument();
    expect(await screen.findByText("Insomnia")).toBeInTheDocument();
    expect(screen.getByText("Condition")).toBeInTheDocument();
    expect(screen.getByText("Treatment · yours")).toBeInTheDocument();
    expect(screen.getByText("Activity and Behavior")).toBeInTheDocument();
    // A vital sign is in the health category but is not a condition.
    expect(screen.getByText("Blood Pressure").parentElement).toHaveTextContent("Health and Physiology");
    expect(screen.getAllByText("Condition")).toHaveLength(1);
    expect(screen.queryByText(/variables/i)).not.toBeInTheDocument();
  });
});
