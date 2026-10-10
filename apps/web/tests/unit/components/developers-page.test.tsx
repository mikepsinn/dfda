import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DevelopersPage from "@/app/(public)/developers/page";

afterEach(cleanup);

describe("developers page", () => {
  it("lists the OAuth endpoints that exist and names what is not built", () => {
    render(<DevelopersPage />);
    const endpoints = within(screen.getByRole("table", { name: "OAuth endpoints" })).getAllByRole("cell").map(cell => cell.textContent);
    for (const path of ["/.well-known/oauth-authorization-server/api/auth", "/api/auth/oauth2/authorize", "/api/auth/oauth2/token", "/api/auth/oauth2/register"]) {
      expect(endpoints.some(url => url?.endsWith(path))).toBe(true);
    }
    expect(screen.getByRole("link", { name: "Open the developer dashboard" })).toHaveAttribute("href", "/developer");
    expect(within(screen.getByRole("region", { name: "Not built yet" })).getByText(/An MCP server/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", "/contact");
  });

  it("makes no claims about features that do not exist", () => {
    render(<DevelopersPage />);
    for (const removed of [/api\.dfda\.earth/, /API key/i, /50,000/, /HIPAA/, /FHIR/, /Webhooks/, /Forum/, /Email Support/, /revenue/]) {
      expect(screen.queryByText(removed)).not.toBeInTheDocument();
    }
  });
});
