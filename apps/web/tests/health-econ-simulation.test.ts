/**
 * @jest-environment node
 */

import { MuscleMassInterventionModel } from "@/lib/health-econ-simulation/outcomes/muscle-mass-model";

describe("Health Economic Simulation Tests", () => {
    it("simulates follistatin muscle mass intervention impact", async () => {
        // Import and use the MuscleMassInterventionModel
        const model = new MuscleMassInterventionModel(5); // 5 lbs muscle mass increase
        const report = model.generate_report();
        
        // Save report to HTML file
        const fs = require('fs');
        const outputPath = './reports/muscle-mass-intervention-report.html';
        
        // Ensure reports directory exists
        if (!fs.existsSync('./reports')) {
            fs.mkdirSync('./reports', { recursive: true });
        }
        
        fs.writeFileSync(outputPath, report);
        
        // Verify report was generated correctly
        expect(fs.existsSync(outputPath)).toBe(true);
        const savedReport = fs.readFileSync(outputPath, 'utf-8');
        expect(savedReport).toContain("<!DOCTYPE html>");
        expect(savedReport).toContain("Muscle Mass Intervention Analysis Report");
        expect(savedReport).toContain("5 lbs per person");
        
    }, 60000); // Allow 60s for analysis
});

function formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
} 