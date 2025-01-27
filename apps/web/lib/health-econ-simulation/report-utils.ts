import { MuscleMassInterventionModel } from './outcomes/muscle-mass-model';
import { metabolicOutcomeMetrics, healthOutcomeMetrics, economicOutcomeMetrics } from './outcomes/muscle-mass';
import { ReportData } from './report-generator';

export function generateMuscleMassReportData(
    model: MuscleMassInterventionModel
): ReportData {
    console.log('[generateMuscleMassReportData] Model:', {
        muscle_mass_increase: model.muscle_mass_increase_per_person,
        population_size: model.baselineMetrics.population_size
    });

    // Get the values directly from the model
    const metabolic = model.calculate_metabolic_impact();
    const health = model.calculate_health_outcomes();
    const economic = model.calculate_economic_impact();
    const baselineMetrics = model.baselineMetrics;

    console.log('[generateMuscleMassReportData] Calculated impacts:', {
        metabolic,
        health,
        economic,
        baselineMetrics
    });

    return {
        title: "Muscle Mass Intervention Analysis",
        description: "Analysis of health and economic impacts from increasing muscle mass in a population.",
        intervention: {
            name: "Muscle Mass Increase",
            value: model.muscle_mass_increase_per_person,
            unit: "lbs per person",
            populationSize: model.baselineMetrics.population_size
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
} 