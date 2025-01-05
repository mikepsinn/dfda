import { metabolicOutcomeMetrics, healthOutcomeMetrics, economicOutcomeMetrics, OutcomeMetric } from './muscle-mass-outcome-metrics';
import ReactDOMServer from 'react-dom/server';
import { MuscleMassReport } from '@/components/health-econ/MuscleMassReport';
import { populationHealthMetrics } from '../population-health-metrics';
import { z } from 'zod';

// Zod schema for runtime validation
const populationConfigSchema = z.object({
    population_size: z.number().positive(),
    description: z.string().optional()
});

export type PopulationConfig = z.infer<typeof populationConfigSchema>;

interface BaselineMetrics {
    resting_metabolic_rate: number;  // calories per day
    insulin_sensitivity: number;      // relative scale
    fall_risk: number;               // annual probability
    healthcare_costs: number;         // annual per person
    disability_risk: number;          // annual probability
    mortality_risk: number;          // annual probability
    medicare_total_annual_spend: number;  // Total Medicare spend in USD (2021 data)
    population_size: number;
}

interface MetabolicImpact extends Record<keyof typeof metabolicOutcomeMetrics, number> {}
interface HealthOutcomes extends Record<keyof typeof healthOutcomeMetrics, number> {}
interface EconomicImpact extends Record<keyof typeof economicOutcomeMetrics, number> {}

export class MuscleMassInterventionModel {
    private muscle_mass_increase: number;
    private population_config: PopulationConfig;
    private health_metrics: typeof populationHealthMetrics;

    constructor(muscle_mass_increase_lbs: number, population_config: Partial<PopulationConfig> = {}) {
        this.muscle_mass_increase = muscle_mass_increase_lbs;
        
        // Create a complete population config with defaults
        const complete_config = {
            population_size: 100000,
            ...population_config
        };
        
        // Validate population config at runtime
        this.population_config = populationConfigSchema.parse(complete_config);
        this.health_metrics = populationHealthMetrics;
    }

    get baselineMetrics() {
        return {
            ...Object.fromEntries(
                Object.entries(this.health_metrics).map(([key, metric]) => [key, metric.defaultValue])
            ),
            population_size: this.population_config.population_size
        };
    }

    calculate_metabolic_impact(): MetabolicImpact {
        return Object.fromEntries(
            Object.entries(metabolicOutcomeMetrics).map(([key, metric]) => [
                key,
                metric.calculate(this.muscle_mass_increase)
            ])
        ) as MetabolicImpact;
    }

    calculate_health_outcomes(): HealthOutcomes {
        return Object.fromEntries(
            Object.entries(healthOutcomeMetrics).map(([key, metric]) => [
                key,
                metric.calculate(this.muscle_mass_increase)
            ])
        ) as HealthOutcomes;
    }

    calculate_economic_impact(population_size?: number): EconomicImpact {
        const metrics = { 
            ...this.baselineMetrics,
            population_size: population_size || this.population_config.population_size 
        };
        return Object.fromEntries(
            Object.entries(economicOutcomeMetrics).map(([key, metric]) => [
                key,
                metric.calculate(this.muscle_mass_increase, metrics)
            ])
        ) as EconomicImpact;
    }

    getParameterMetadata(category: 'metabolic' | 'health' | 'economic', key: string): OutcomeMetric | undefined {
        switch (category) {
            case 'metabolic':
                return metabolicOutcomeMetrics[key as keyof typeof metabolicOutcomeMetrics];
            case 'health':
                return healthOutcomeMetrics[key as keyof typeof healthOutcomeMetrics];
            case 'economic':
                return economicOutcomeMetrics[key as keyof typeof economicOutcomeMetrics];
            default:
                return undefined;
        }
    }

    generate_report(): string {
        // Render the React component to static HTML
        const html = ReactDOMServer.renderToString(
            MuscleMassReport({
                muscleMassIncrease: this.muscle_mass_increase,
                populationSize: this.population_config.population_size
            })
        );

        // Add necessary HTML wrapper and styles
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Muscle Mass Intervention Analysis Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Add any additional styles needed for the report */
        .prose { max-width: none; }
        .list-circle { list-style-type: circle; }
    </style>
</head>
<body>
    <div class="container mx-auto px-4 py-8">
        ${html}
    </div>
</body>
</html>`;
    }
}
