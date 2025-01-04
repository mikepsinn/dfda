import React from 'react';
import { MuscleMassInterventionModel } from '@/lib/health-econ-simulation/outcomes/muscle-mass-model';
import { metabolicOutcomeMetrics, healthOutcomeMetrics, economicOutcomeMetrics, OutcomeMetric } from '@/lib/health-econ-simulation/outcomes/muscle-mass-outcome-metrics';

interface MuscleMassReportProps {
  muscleMassIncrease: number;
  populationSize?: number;
}

export const MuscleMassReport: React.FC<MuscleMassReportProps> = ({
  muscleMassIncrease,
  populationSize = 100000,
}) => {
  const model = new MuscleMassInterventionModel(muscleMassIncrease, populationSize);
  const metabolic = model.calculate_metabolic_impact();
  const health = model.calculate_health_outcomes();
  const economic = model.calculate_economic_impact(populationSize);

  // Helper function for number formatting (only used for population size display)
  const formatNumber = (num: number, decimals: number = 2) => new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);

  // Helper function to render a metric with its metadata and calculation
  const renderMetric = (value: number, metric: OutcomeMetric) => {
    const sensitivity = metric.calculateSensitivity(muscleMassIncrease, { ...model.baselineMetrics, population_size: populationSize });
    
    return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-xl sm:text-2xl">{metric.emoji}</span>
        <h3 className="font-medium">{metric.displayName}</h3>
      </div>
      <span className="text-lg sm:text-xl font-semibold">
        {metric.generateDisplayValue(value)}
      </span>
      <p className="text-gray-600 mb-2 text-sm sm:text-base">{metric.description}</p>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <a
          href={metric.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
        >
          <img 
            src={`https://www.google.com/s2/favicons?domain=${new URL(metric.sourceUrl).hostname}`}
            alt=""
            className="w-4 h-4"
          />
          {new URL(metric.sourceUrl).hostname}
        </a>
      </div>
      <div className="text-sm border-t pt-4 mt-2">
        <h4 className="font-medium mb-2 text-base">Calculations</h4>
        <div
          className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mb-2 [&_.formula]:pl-4 [&_.formula]:border-l-2 [&_.formula]:border-gray-200 [&_.formula]:my-2"
          dangerouslySetInnerHTML={{
            __html: metric.generateCalculationExplanation(muscleMassIncrease, { ...model.baselineMetrics, population_size: populationSize })
          }}
        />
      </div>
      <div className="text-sm border-t pt-4 mt-4">
        <h4 className="font-medium mb-2">Model Parameters</h4>
        <div className="grid gap-3">
          {metric.modelParameters.map((param, index) => (
            <div key={index} className="bg-white p-3 rounded border">
              <div className="flex items-center gap-2">
                <span className="text-lg">{param.emoji}</span>
                <h5 className="font-medium">{param.displayName}</h5>
              </div>
              <p className="text-sm text-gray-600 mt-1">{param.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium">
                  {param.generateDisplayValue ? param.generateDisplayValue(param.defaultValue) : `${param.defaultValue} ${param.unitName}`}
                </span>
                <a
                  href={param.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${new URL(param.sourceUrl).hostname}`}
                    alt=""
                    className="w-3 h-3"
                  />
                  {new URL(param.sourceUrl).hostname}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-sm border-t pt-4 mt-4">
        <h4 className="font-medium mb-2">Sensitivity Analysis</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Best Case:</p>
            <p className="font-semibold">{metric.generateDisplayValue(sensitivity.bestCase)}</p>
          </div>
          <div>
            <p className="text-gray-600">Worst Case:</p>
            <p className="font-semibold">{metric.generateDisplayValue(sensitivity.worstCase)}</p>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-gray-600">Assumptions:</p>
          <ul className="list-disc pl-5 mt-1">
            {sensitivity.assumptions.map((assumption: string, index: number) => (
              <li key={index} className="text-gray-700">{assumption}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

  return (
    <article className="max-w-none">
      {/* Intervention Details */}
      <section className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Intervention Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Muscle Mass Increase</p>
            <p className="text-lg sm:text-xl">{muscleMassIncrease} lbs per person</p>
          </div>
          <div>
            <p className="font-medium">Target Population</p>
            <p className="text-lg sm:text-xl">{formatNumber(populationSize, 0)} individuals</p>
          </div>
        </div>
      </section>

      {/* Metabolic Impact */}
      <section className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Metabolic Impact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(metabolic).map(([key, value]) => (
            <React.Fragment key={key}>
              {renderMetric(value, metabolicOutcomeMetrics[key])}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Health Outcomes */}
      <section className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Health Outcomes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(health).map(([key, value]) => (
            <React.Fragment key={key}>
              {renderMetric(value, healthOutcomeMetrics[key])}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Economic Impact */}
      <section className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Economic Impact (Annual)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(economic).map(([key, value]) => (
            <React.Fragment key={key}>
              {renderMetric(value, economicOutcomeMetrics[key])}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Methodology Notes */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Methodology Notes</h2>
        <div className="p-4 bg-gray-50 rounded-lg">
          <ul className="list-disc pl-5 space-y-2">
            <li>All calculations use validated equations from peer-reviewed research</li>
            <li>Health outcomes are based on conservative estimates from meta-analyses</li>
            <li>Economic impact includes direct healthcare savings and indirect productivity gains</li>
            <li>Risk reductions are calculated using linear scaling with established upper bounds</li>
          </ul>
        </div>
      </section>

      {/* Limitations */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Limitations</h2>
        <div className="p-4 bg-gray-50 rounded-lg">
          <ul className="list-disc pl-5 space-y-2">
            <li>Individual results may vary based on age, gender, and baseline health status</li>
            <li>Long-term adherence to muscle mass maintenance not considered</li>
            <li>Intervention costs not included in economic calculations</li>
            <li>Results are based on population-level statistics and may not reflect individual outcomes</li>
            <li>Muscle mass measurements in source studies used bioelectrical impedance, which may have some measurement limitations</li>
          </ul>
        </div>
      </section>

      {/* Statistical Validation */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Statistical Validation</h2>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="mb-4">The mortality predictions in our model are based on robust statistical analyses from the NHANES III study, which used:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Modified Poisson regression with robust estimation</li>
            <li>Cox proportional hazards regression</li>
            <li>Adjustment for multiple covariates including:
              <ul className="list-circle pl-5 mt-2">
                <li>Age, sex, race/ethnicity</li>
                <li>Smoking status</li>
                <li>Cancer history</li>
                <li>Central obesity</li>
                <li>Cardiovascular risk factors</li>
                <li>Glucose metabolism measures</li>
              </ul>
            </li>
          </ul>
        </div>
      </section>
    </article>
  );
}; 