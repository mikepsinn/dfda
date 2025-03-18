/**
 * @jest-environment node
 */

import { drugPriceModelParameters } from "@/lib/health-econ-simulation/drug-price-model";
import { calculatePriceChange } from "@/lib/health-econ-simulation/drug-price-model";
import { MuscleMassInterventionModel } from "@/lib/health-econ-simulation/outcomes/muscle-mass-model";

describe("Health Economic Simulation Tests", () => {
    it('calculates the percentage change in drug price correctly', () => {
        const costReductionPercentage = 95; // Reduce clinical trial costs by 10%
        const expectedPriceChange = -20.833333333333332; // Expected price change
    
        const actualPriceChange = calculatePriceChange(costReductionPercentage, drugPriceModelParameters);
        expect(actualPriceChange).toBeCloseTo(expectedPriceChange);
      });
});

