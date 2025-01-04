import { metabolicOutcomeMetrics, healthOutcomeMetrics, economicOutcomeMetrics, OutcomeMetric } from './muscle-mass-outcome-metrics';
import ReactDOMServer from 'react-dom/server';
import { MuscleMassReport } from '@/components/health-econ/MuscleMassReport';
import { ModelParameter } from '../types';
import { baselineMetrics } from './baseline-metrics';

// Fixed baseline metrics from configuration
type FixedBaselineMetrics = typeof baselineMetrics;

// Variable parameters that can be set per model instance
interface VariableParameters {
    population_size: number;
}

// Combined metrics type for use in calculations
interface ModelMetrics extends FixedBaselineMetrics {
    population_size: ModelParameter;
}

interface MetabolicImpact extends Record<keyof typeof metabolicOutcomeMetrics, number> {}
interface HealthOutcomes extends Record<keyof typeof healthOutcomeMetrics, number> {}
interface EconomicImpact extends Record<keyof typeof economicOutcomeMetrics, number> {}

export class MuscleMassInterventionModel {
    private muscle_mass_increase: number;
    private variable_params: VariableParameters;
    private model_metrics: ModelMetrics;

    constructor(muscle_mass_increase_lbs: number, population_size: number = 100000) {
        this.muscle_mass_increase = muscle_mass_increase_lbs;
        this.variable_params = {
            population_size
        };
        
        // Combine fixed and variable parameters into model metrics
        this.model_metrics = {
            ...baselineMetrics,
            population_size: {
                displayName: "Target Population Size",
                defaultValue: population_size,
                unitName: "people",
                description: "Size of the population being analyzed",
                sourceUrl: "",
                emoji: "👥",
                generateDisplayValue: (value: number) => value.toLocaleString()
            }
        };
    }

    get baselineMetrics(): ModelMetrics {
        return this.model_metrics;
    }

    get variableParameters(): VariableParameters {
        return this.variable_params;
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
        // Update model metrics if a new population size is provided
        const metrics = population_size ? {
            ...this.model_metrics,
            population_size: {
                ...this.model_metrics.population_size,
                defaultValue: population_size
            }
        } : this.model_metrics;

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
                populationSize: this.variable_params.population_size
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
