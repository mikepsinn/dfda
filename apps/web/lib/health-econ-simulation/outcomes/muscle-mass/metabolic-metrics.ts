import { muscleMassParameters } from '../muscle-mass-parameters';
import { populationHealthMetrics } from '../../population-health-metrics';
import { OutcomeMetric, formatLargeNumber, validateMuscleMass } from './utils';

export const metabolicOutcomeMetrics: Record<string, OutcomeMetric> = {
    additional_daily_calories_burned: {
        displayName: "Additional Daily Calories Burned",
        defaultValue: 0,
        unitName: "calories/day/person",
        description: "Additional calories burned per day per person due to increased muscle mass",
        sourceUrl: muscleMassParameters.muscle_calorie_burn.sourceUrl,
        emoji: "🔥",
        modelParameters: [muscleMassParameters.muscle_calorie_burn, populationHealthMetrics.resting_metabolic_rate],
        calculate: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Additional Daily Calories Burned');
            return muscleMassIncreasePerPerson * muscleMassParameters.muscle_calorie_burn.defaultValue;
        },
        generateDisplayValue: (value) => `${formatLargeNumber(value)} calories/day/person`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Additional Daily Calories Explanation');
            return `
            <div class="calculation-explanation">
                <p>Each pound of muscle burns approximately ${muscleMassParameters.muscle_calorie_burn.defaultValue} calories per day:</p>
                <div class="formula">
                    ${muscleMassIncreasePerPerson} lbs × ${muscleMassParameters.muscle_calorie_burn.defaultValue} calories/day = ${muscleMassIncreasePerPerson * muscleMassParameters.muscle_calorie_burn.defaultValue} calories/day
                </div>
            </div>`;
        },
        calculateSensitivity: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Additional Daily Calories Sensitivity');
            const baseValue = muscleMassIncreasePerPerson * muscleMassParameters.muscle_calorie_burn.defaultValue;
            return {
                bestCase: muscleMassIncreasePerPerson * 10, // Upper range of calories burned
                worstCase: muscleMassIncreasePerPerson * 6, // Lower range of calories burned
                assumptions: [
                    'Upper bound: 10 calories per pound of muscle per day',
                    'Lower bound: 6 calories per pound of muscle per day',
                    'Based on range reported in literature'
                ]
            };
        }
    },
    annual_metabolic_impact: {
        displayName: "Annual Metabolic Impact",
        defaultValue: 0,
        unitName: "calories/year/person",
        description: "Total additional calories burned per year per person due to increased muscle mass",
        sourceUrl: muscleMassParameters.muscle_calorie_burn.sourceUrl,
        emoji: "📅",
        modelParameters: [muscleMassParameters.muscle_calorie_burn, populationHealthMetrics.resting_metabolic_rate],
        calculate: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Annual Metabolic Impact');
            return muscleMassIncreasePerPerson * muscleMassParameters.muscle_calorie_burn.defaultValue * 365;
        },
        generateDisplayValue: (value) => `${formatLargeNumber(value)} calories/year/person`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Annual Metabolic Impact Explanation');
            return `
            <div class="calculation-explanation">
                <p>Annual impact is calculated by multiplying daily caloric burn by 365 days:</p>
                <div class="formula">
                    (${muscleMassIncreasePerPerson} lbs × ${muscleMassParameters.muscle_calorie_burn.defaultValue} calories/day) × 365 days = ${muscleMassIncreasePerPerson * muscleMassParameters.muscle_calorie_burn.defaultValue * 365} calories/year
                </div>
            </div>`;
        },
        calculateSensitivity: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Annual Metabolic Impact Sensitivity');
            const baseValue = muscleMassIncreasePerPerson * muscleMassParameters.muscle_calorie_burn.defaultValue * 365;
            return {
                bestCase: muscleMassIncreasePerPerson * 10 * 365,
                worstCase: muscleMassIncreasePerPerson * 6 * 365,
                assumptions: [
                    'Based on daily caloric burn variation',
                    'Assumes consistent metabolic rate throughout the year'
                ]
            };
        }
    }
}; 