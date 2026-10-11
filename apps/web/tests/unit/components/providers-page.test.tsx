import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ProvidersPage from "@/app/(public)/providers/page";

afterEach(cleanup);

describe("providers page", () => {
  it("states what it offers without sales slogans, and links to registration", () => {
    render(<ProvidersPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pragmatic Trials for Your Patients");
    expect(screen.getByRole("link", { name: /^Get Started/ })).toHaveAttribute("href", "/register");
    for (const removed of [/Accelerate Research/, /pragmatic trial methodology/, /with Confidence/, /intuitive/]) {
      expect(screen.queryByText(removed)).not.toBeInTheDocument();
    }
  });
});
