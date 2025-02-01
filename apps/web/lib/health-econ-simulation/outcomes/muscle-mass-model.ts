import { OutcomeMetric } from './muscle-mass-outcome-metrics';
import ReactDOMServer from 'react-dom/server';
import { MuscleMassReport } from '@/components/health-econ/MuscleMassReport';
import { populationHealthMetrics } from '../population-health-metrics';
import { z } from 'zod';
import { metabolicOutcomeMetrics } from '@/lib/health-econ-simulation/outcomes/muscle-mass/metabolic-metrics';
import { healthOutcomeMetrics } from '@/lib/health-econ-simulation/outcomes/muscle-mass/health-metrics';
import { economicOutcomeMetrics } from '@/lib/health-econ-simulation/outcomes/muscle-mass/economic-metrics';

// Zod schema for runtime validation
const populationConfigSchema = z.object({
    population_size: z.number().positive(),
    description: z.string().optional()
});

export type PopulationConfig = z.infer<typeof populationConfigSchema>;

interface MetabolicImpact extends Record<keyof typeof metabolicOutcomeMetrics, number> {}
interface HealthOutcomes extends Record<keyof typeof healthOutcomeMetrics, number> {}
interface EconomicImpact extends Record<keyof typeof economicOutcomeMetrics, number> {}

export class MuscleMassInterventionModel {
    muscle_mass_increase_per_person: number;
    private population_config: PopulationConfig;
    private health_metrics: typeof populationHealthMetrics;

    constructor(muscle_mass_increase_per_person_lbs: number, population_config: Partial<PopulationConfig> = {}) {
        this.muscle_mass_increase_per_person = muscle_mass_increase_per_person_lbs;
        
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
                metric.calculate(this.muscle_mass_increase_per_person)
            ])
        ) as MetabolicImpact;
    }

    calculate_health_outcomes(): HealthOutcomes {
        return Object.fromEntries(
            Object.entries(healthOutcomeMetrics).map(([key, metric]) => [
                key,
                metric.calculate(this.muscle_mass_increase_per_person)
            ])
        ) as HealthOutcomes;
    }

    calculate_economic_impact(): EconomicImpact {
        const metrics = this.baselineMetrics;
        return Object.fromEntries(
            Object.entries(economicOutcomeMetrics).map(([key, metric]) => [
                key,
                metric.calculate(this.muscle_mass_increase_per_person, metrics)
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
                muscleMassIncreasePerPerson: this.muscle_mass_increase_per_person,
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
