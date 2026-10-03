import { describe, expect, it } from "vitest";
import { getAllMobileNavItems, loggedOutPrimaryNavItems, secondaryNavItems } from "@/lib/navigation";

describe("phone menu", () => {
  it("lists each page once for logged-out visitors, primary links first", () => {
    const items = getAllMobileNavItems(null);
    const hrefs = items.map(item => item.href);
    const titles = items.map(item => item.title.toLowerCase());
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(new Set(titles).size).toBe(titles.length);
    expect(items.slice(0, loggedOutPrimaryNavItems.length)).toEqual(loggedOutPrimaryNavItems);
    // Every secondary page is still reachable, unless a primary link already covers it.
    for (const item of secondaryNavItems) {
      expect(items.some(shown => shown.href === item.href || shown.title === item.title), item.title).toBe(true);
    }
  });
});
