/**
 * @jest-environment node
 */

import { HealthEconomicSimulation, SimulationOptions, SimulationResult } from "@/lib/health-econ-simulation/health-econ-simulation";

describe("Health Economic Simulation Tests", () => {
    it("simulates Alzheimer's early detection program impact", async () => {
        // Create simulation with known parameters from clinical trials and research
        const simulation = new HealthEconomicSimulation({
            intervention: {
                name: "Early Alzheimer's Detection Program",
                description: "A comprehensive screening program for early detection of Alzheimer's disease using biomarkers and cognitive assessments",
                knownParameters: {
                    cognitiveHealth: {
                        neurodegeneration: {
                            conditionName: "Alzheimer's Disease",
                            progressionSlowingPercent: {
                                name: "Disease Progression Slowing",
                                value: 30,
                                unit: "percent",
                                confidence: 0.85,
                                source: "Meta-analysis of early intervention trials",
                                timeframe: "annual",
                                populationAffected: "Adults 65+ with early-stage Alzheimer's"
                            },
                            symptomReduction: {
                                name: "Symptom Severity Reduction",
                                value: 25,
                                unit: "percent",
                                confidence: 0.8,
                                source: "Clinical trials of early intervention",
                                timeframe: "annual"
                            }
                        }
                    },
                    healthcareUtilization: {
                        hospitalizations: {
                            admissionRate: {
                                name: "Hospital Admission Rate Reduction",
                                value: 20,
                                unit: "percent",
                                confidence: 0.75,
                                source: "Healthcare utilization studies",
                                timeframe: "annual"
                            },
                            lengthOfStay: {
                                name: "Average Length of Stay Reduction",
                                value: 2,
                                unit: "days",
                                confidence: 0.8,
                                source: "Hospital records analysis",
                                timeframe: "per admission"
                            }
                        },
                        medicationUse: {
                            adherenceRate: {
                                name: "Medication Adherence Improvement",
                                value: 35,
                                unit: "percent",
                                confidence: 0.9,
                                source: "Medication adherence studies",
                                timeframe: "annual"
                            }
                        }
                    },
                    publicHealth: {
                        diseasePrevalence: {
                            incidenceRate: {
                                name: "Severe Case Reduction",
                                value: 25,
                                unit: "percent",
                                confidence: 0.8,
                                source: "Population health studies",
                                timeframe: "annual"
                            }
                        }
                    }
                }
            },
            economic: {
                timeHorizon: 10,
                discountRate: 0.03,
                region: "United States",
                populationSize: 5600000, // Estimated US Alzheimer's population
                monetaryYear: 2023
            },
            research: {
                modelName: "gpt-4o-mini",
                numberOfSearchResults: 30,
                minConfidence: 0.7,
                requireSource: true
            }
        });

        // Run simulation
        const results = await simulation.simulate();
        
        // Log detailed results
        console.log("Alzheimer's Early Detection Program - Economic Impact Analysis");
        console.log("========================================================");
        
        console.log("\nIntervention Effects:");
        if (results.interventionEffects.cognitiveHealth?.neurodegeneration) {
            const neuro = results.interventionEffects.cognitiveHealth.neurodegeneration;
            console.log(`Disease Progression Slowing: ${neuro.progressionSlowingPercent?.value}%`);
            console.log(`Symptom Reduction: ${neuro.symptomReduction?.value}%`);
        }

        console.log("\nHealthcare Impact:");
        console.log(`Direct Cost Savings: $${formatMoney(results.economicImpact.healthcare.directCostSavings)}`);
        console.log(`Medicare/Medicaid Savings: $${formatMoney(results.economicImpact.healthcare.medicareMedicaidSavings)}`);
        
        console.log("\nProductivity Impact:");
        console.log(`GDP Gains: $${formatMoney(results.economicImpact.productivity.gdpGain)}`);
        console.log(`Workforce Participation Change: ${results.economicImpact.productivity.workforceParticipation}%`);
        
        console.log("\nQuality of Life Impact:");
        console.log(`QALYs Gained: ${results.economicImpact.qualityOfLife.qalyGained.toFixed(2)}`);
        console.log(`Monetary Value of QALY Gains: $${formatMoney(results.economicImpact.qualityOfLife.monetaryValueQaly)}`);
        
        console.log("\nTime Horizon Analysis:");
        console.log(`1-Year Impact: $${formatMoney(results.economicImpact.timeHorizon.shortTerm)}`);
        console.log(`5-Year Impact: $${formatMoney(results.economicImpact.timeHorizon.mediumTerm)}`);
        console.log(`10-Year Impact: $${formatMoney(results.economicImpact.timeHorizon.longTerm)}`);
        
        console.log("\nMetadata:");
        console.log(`Confidence Level: ${(results.metadata.confidence * 100).toFixed(1)}%`);
        console.log(`Sources Used: ${results.metadata.sourcesUsed}`);
        console.log(`Computation Time: ${results.metadata.computationTimeMs}ms`);

        // Assertions to verify reasonable results
        expect(results.economicImpact.healthcare.directCostSavings).toBeGreaterThan(0);
        expect(results.economicImpact.healthcare.medicareMedicaidSavings).toBeGreaterThan(0);
        expect(results.economicImpact.qualityOfLife.qalyGained).toBeGreaterThan(0);
        expect(results.economicImpact.timeHorizon.longTerm).toBeGreaterThan(results.economicImpact.timeHorizon.shortTerm);
        expect(results.metadata.confidence).toBeGreaterThanOrEqual(0.7);

        // Verify intervention effects were properly analyzed
        expect(results.interventionEffects.cognitiveHealth?.neurodegeneration?.progressionSlowingPercent?.value).toBe(30);
        expect(results.interventionEffects.healthcareUtilization?.hospitalizations?.admissionRate?.value).toBe(20);
        expect(results.interventionEffects.publicHealth?.diseasePrevalence?.incidenceRate?.value).toBe(25);
    }, 60000); // Allow 60s for comprehensive analysis
});

function formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
} 