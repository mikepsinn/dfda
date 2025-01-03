/**
 * @jest-environment node
 */

import { HealthEconomicSimulation, SimulationOptions, SimulationResult } from "@/lib/health-econ-simulation/health-econ-simulation";

describe("Health Economic Simulation Tests", () => {
    it("simulates follistatin muscle mass intervention impact", async () => {
        const simulation = new HealthEconomicSimulation({
            intervention: {
                name: "Follistatin Restoration Therapy",
                description: "A therapy that restores follistatin levels in the body to increase muscle mass",
                knownParameters: {
                    physicalHealth: {
                        bodyComposition: {
                            muscleMassChange: {
                                name: "Muscle Mass Increase",
                                value: 2,
                                unit: "pounds",
                                confidence: 0.85,
                                source: "Clinical trials of follistatin therapy",
                                timeframe: "3-month",
                                populationAffected: "Adults receiving follistatin therapy"
                            }
                        }
                    }
                }
            },
            economic: {
                timeHorizon: 1,
                discountRate: 0.03,
                region: "United States",
                populationSize: 1000000, // Target population size
                monetaryYear: 2023
            },
            research: {
                modelName: "gpt-4o-mini",
                numberOfSearchResults: 3,
                minConfidence: 0.7,
                requireSource: true
            }
        });

        // Run simulation
        const results = await simulation.simulate();
        
        // Log results
        console.log("Follistatin Therapy - Economic Impact Analysis");
        console.log("========================================================");
        
        console.log("\nIntervention Effects:");
        const muscleMassChange = results.interventionEffects.physicalHealth?.bodyComposition?.muscleMassChange;
        if (muscleMassChange) {
            console.log(`Muscle Mass Change: ${muscleMassChange.value} ${muscleMassChange.unit}`);
            console.log(`Confidence: ${(muscleMassChange.confidence * 100).toFixed(1)}%`);
            console.log(`Timeframe: ${muscleMassChange.timeframe}`);
        }

        console.log("\nHealthcare Impact:");
        console.log(`Direct Cost Savings: $${formatMoney(results.economicImpact.healthcare.directCostSavings)}`);
        
        console.log("\nProductivity Impact:");
        console.log(`GDP Gains: $${formatMoney(results.economicImpact.productivity.gdpGain)}`);
        
        console.log("\nQuality of Life Impact:");
        console.log(`QALYs Gained: ${results.economicImpact.qualityOfLife.qalyGained.toFixed(2)}`);
        
        console.log("\nTime Horizon Analysis:");
        console.log(`1-Year Impact: $${formatMoney(results.economicImpact.timeHorizon.shortTerm)}`);

        // Basic assertions
        expect(results.economicImpact.healthcare.directCostSavings).toBeGreaterThan(0);
        expect(results.economicImpact.productivity.gdpGain).toBeGreaterThan(0);
        expect(results.economicImpact.qualityOfLife.qalyGained).toBeGreaterThan(0);
        expect(results.metadata.confidence).toBeGreaterThanOrEqual(0.7);

        // Verify specific intervention effect
        expect(results.interventionEffects.physicalHealth?.bodyComposition?.muscleMassChange?.value).toBe(2);
    }, 60000); // Allow 60s for analysis
});

function formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
} 