/**
 * @jest-environment node
 */

import { safeUnapprovedDrugs } from "@/lib/agents/fdai/fdaiAgent";

describe("FDAi Tests", () => {
    it("safe unapproved drugs", async () => {
        const safeUnapproved = await safeUnapprovedDrugs();
        console.log(safeUnapproved);
    }, 45000);
});
