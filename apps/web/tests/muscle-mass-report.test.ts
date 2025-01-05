/**
 * @jest-environment node
 */

import fs from 'fs/promises';
import path from 'path';
import { MuscleMassInterventionModel } from '@/lib/health-econ-simulation/outcomes/muscle-mass-model';
import { generateMarkdownReport } from '@/lib/health-econ-simulation/report-generator';
import { metabolicOutcomeMetrics, healthOutcomeMetrics, economicOutcomeMetrics } from '@/lib/health-econ-simulation/outcomes/muscle-mass-outcome-metrics';

describe('Muscle Mass Report Generation', () => {
    it('generates and saves report without NaN values', async () => {
        // Create model instance with test parameters
        const muscleMassIncrease = 5;
        const populationSize = 10000;
        const model = new MuscleMassInterventionModel(muscleMassIncrease, { population_size: populationSize });
        
        // Calculate impacts
        const metabolic = model.calculate_metabolic_impact();
        const health = model.calculate_health_outcomes();
        const economic = model.calculate_economic_impact(populationSize);
        
        // Get baseline metrics
        const baselineMetrics = model.baselineMetrics;
        
        // Generate markdown report
        const reportData = {
            title: "Muscle Mass Intervention Analysis",
            description: "Analysis of health and economic impacts from increasing muscle mass in a population.",
            intervention: {
                name: "Muscle Mass Increase",
                value: muscleMassIncrease,
                unit: "lbs per person",
                populationSize
            },
            sections: [
                {
                    title: "Metabolic Impact",
                    metrics: metabolic,
                    metricDefinitions: metabolicOutcomeMetrics,
                    baselineMetrics
                },
                {
                    title: "Health Outcomes",
                    metrics: health,
                    metricDefinitions: healthOutcomeMetrics,
                    baselineMetrics
                },
                {
                    title: "Economic Impact",
                    metrics: economic,
                    metricDefinitions: economicOutcomeMetrics,
                    baselineMetrics
                }
            ]
        };
        
        const markdown = generateMarkdownReport(reportData);
        
        // Create output directory
        const outputPath = path.join(process.cwd(), 'test-outputs');
        await fs.mkdir(outputPath, { recursive: true });
        
        // Save markdown report
        await fs.writeFile(
            path.join(outputPath, 'muscle-mass-report.md'),
            markdown
        );
        
        // Verify report content
        expect(markdown).toContain('# Muscle Mass Intervention Analysis');
        expect(markdown).toContain('## Intervention Details');
        expect(markdown).toContain('## Metabolic Impact');
        expect(markdown).toContain('## Health Outcomes');
        expect(markdown).toContain('## Economic Impact');
        expect(markdown).toContain('## Methodology Notes');
        expect(markdown).toContain('## Limitations');
        expect(markdown).toContain('## Statistical Validation');
        
        // Check for NaN values
        expect(markdown).not.toContain('NaN');
        
        // Additional NaN checks for numeric sections
        const numericSections = [
            'calories/day',
            'probability',
            '%',
            'QALYs',
            '$'
        ];
        
        for (const section of numericSections) {
            const sectionContent = markdown.split(section)[0];
            const lastNumber = sectionContent.match(/\d+(\.\d+)?/g)?.pop();
            expect(lastNumber).not.toBeNaN();
            if (lastNumber) {
                expect(Number.isFinite(parseFloat(lastNumber))).toBe(true);
            }
        }
        
        // Verify markdown formatting
        expect(markdown).toMatch(/^# /m);  // Headers start with #
        expect(markdown).toMatch(/\*\*[\w\s]+\*\*/);  // Bold text
        expect(markdown).toMatch(/\[.*\]\(http.*\)/);  // Links
        expect(markdown).toMatch(/^- /m);  // List items
    }, 10000); // Increased timeout for report generation
}); 