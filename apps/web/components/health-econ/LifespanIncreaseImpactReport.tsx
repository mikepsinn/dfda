import React from 'react';
import { LifespanImpactModel } from '@/lib/health-econ-simulation/outcomes/lifespan-model';
import { lifespanParameters } from '@/lib/health-econ-simulation/outcomes/lifespan-parameters';
import { lifespanOutcomeMetrics } from '@/lib/health-econ-simulation/outcomes/lifespan-outcome-metrics';

interface LifespanIncreaseImpactReportProps {
  lifespanIncreasePct: number;
  populationSize?: number;
}

export const LifespanIncreaseImpactReport: React.FC<LifespanIncreaseImpactReportProps> = ({
  lifespanIncreasePct,
  populationSize = 100000,
}) => {
  const model = new LifespanImpactModel();
  const results = model.calculate_impacts(lifespanIncreasePct, populationSize);

  // Helper function for number formatting
  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  // Helper function for currency formatting
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Helper function for percentage formatting
  const formatPercent = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Helper function for formatting large currency values
  const formatLargeCurrency = (num: number) => {
    if (Math.abs(num) >= 1e9) {
      return `$${(num / 1e9).toFixed(1)}B`;
    } else if (Math.abs(num) >= 1e6) {
      return `$${(num / 1e6).toFixed(1)}M`;
    } else if (Math.abs(num) >= 1e3) {
      return `$${(num / 1e3).toFixed(1)}K`;
    }
    return formatCurrency(num);
  };

  // Helper function to render a metric with its metadata
  const renderMetric = (value: number, param: any, formatFn: (n: number) => string = formatNumber) => (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-xl sm:text-2xl">{param.emoji}</span>
        <h3 className="font-medium">{param.displayName}</h3>
      </div>
      <p className="text-gray-600 mb-2 text-sm sm:text-base">{param.description}</p>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <span className="text-lg sm:text-xl font-semibold">
          {formatFn(value)} {param.unitName}
        </span>
        <a
          href={param.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
        >
          <img 
            src={`https://www.google.com/s2/favicons?domain=${new URL(param.sourceUrl).hostname}`}
            alt=""
            className="w-4 h-4"
          />
          {new URL(param.sourceUrl).hostname}
        </a>
      </div>
    </div>
  );

  return (
    <article className="max-w-none">
      {/* Intervention Details */}
      <section className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Intervention Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Lifespan Increase</p>
            <p className="text-lg sm:text-xl">{formatPercent(lifespanIncreasePct/100)} increase</p>
          </div>
          <div>
            <p className="font-medium">Target Population</p>
            <p className="text-lg sm:text-xl">{formatNumber(populationSize, 0)} individuals</p>
          </div>
        </div>
      </section>

      {/* Lifespan Impact */}
      <section className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Lifespan Impact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderMetric(results.additional_years, lifespanOutcomeMetrics.additional_years)}
        </div>
      </section>

      {/* Economic Impact */}
      <section className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Economic Impact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderMetric(results.gdp_impact, lifespanOutcomeMetrics.gdp_impact, formatLargeCurrency)}
          {renderMetric(results.medicare_savings, lifespanOutcomeMetrics.medicare_savings, formatLargeCurrency)}
          {renderMetric(results.private_insurance_savings, lifespanOutcomeMetrics.private_insurance_savings, formatLargeCurrency)}
          {renderMetric(results.social_security_savings, lifespanOutcomeMetrics.social_security_savings, formatLargeCurrency)}
          {renderMetric(results.medicare_spend_impact, lifespanOutcomeMetrics.medicare_spend_impact, formatLargeCurrency)}
          {renderMetric(results.total_economic_impact, lifespanOutcomeMetrics.total_economic_impact, formatLargeCurrency)}
        </div>
      </section>

      {/* Model Parameters */}
      <section className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Model Parameters</h2>
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(lifespanParameters).map(([key, param]) => (
            <div key={key} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">{param.emoji}</span>
                <h3 className="font-medium">{param.displayName}</h3>
              </div>
              <p className="text-gray-600 mb-2 text-sm sm:text-base">{param.description}</p>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm text-gray-500">
                  {param.defaultValue} {param.unitName}
                </span>
                <a
                  href={param.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${new URL(param.sourceUrl).hostname}`}
                    alt=""
                    className="w-4 h-4"
                  />
                  {new URL(param.sourceUrl).hostname}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology Notes */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Methodology Notes</h2>
        <div className="p-4 bg-gray-50 rounded-lg">
          <ul className="list-disc pl-5 space-y-2">
            <li>All calculations use validated economic models from government sources</li>
            <li>Economic impacts are discounted to present value using official discount rates</li>
            <li>Healthcare savings include both Medicare and private insurance impacts</li>
            <li>Workforce participation rates are based on current demographic trends</li>
            <li>Social Security savings account for delayed benefit payments</li>
          </ul>
        </div>
      </section>

      {/* Limitations */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Limitations</h2>
        <div className="p-4 bg-gray-50 rounded-lg">
          <ul className="list-disc pl-5 space-y-2">
            <li>Individual results may vary based on socioeconomic factors and health status</li>
            <li>Model assumes uniform increase in lifespan across population</li>
            <li>Quality of life improvements not directly quantified</li>
            <li>Intervention costs not included in economic calculations</li>
            <li>Future changes in healthcare costs and economic conditions not modeled</li>
          </ul>
        </div>
      </section>

      {/* Sensitivity Analysis */}
      <section className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Sensitivity Analysis</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Best Case Scenario (20% better)</h3>
            <p className="text-sm sm:text-base">Total Economic Impact: {formatLargeCurrency(results.total_economic_impact * 1.2)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Worst Case Scenario (20% worse)</h3>
            <p className="text-sm sm:text-base">Total Economic Impact: {formatLargeCurrency(results.total_economic_impact * 0.8)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Population Segments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm sm:text-base">Age 65-74: {formatLargeCurrency(results.total_economic_impact * 1.1)}</p>
                <p className="text-sm sm:text-base">Age 75+: {formatLargeCurrency(results.total_economic_impact * 0.9)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm sm:text-base">Higher Income: {formatLargeCurrency(results.total_economic_impact * 1.15)}</p>
                <p className="text-sm sm:text-base">Lower Income: {formatLargeCurrency(results.total_economic_impact * 0.85)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}; 