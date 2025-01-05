import { MuscleMassInterventionModel } from './outcomes/muscle-mass-model';
import { metabolicOutcomeMetrics, healthOutcomeMetrics, economicOutcomeMetrics } from './outcomes/muscle-mass-outcome-metrics';
import { ReportData } from './report-generator';

export function generateMuscleMassReportData(
    model: MuscleMassInterventionModel,
    muscleMassIncrease: number,
    populationSize: number
): ReportData {
    const metabolic = model.calculate_metabolic_impact();
    const health = model.calculate_health_outcomes();
    const economic = model.calculate_economic_impact(populationSize);
    const baselineMetrics = model.baselineMetrics;

    return {
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
} 