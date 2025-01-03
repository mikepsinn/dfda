import React, { useState } from 'react';
import { MuscleMassInterventionModel } from '@/lib/health-econ-simulation/outcomes/muscle-mass-model';
import { muscleMassParameters } from '@/lib/health-econ-simulation/outcomes/muscle-mass-parameters';
import { MuscleMassCalculations } from './MuscleMassCalculations';

interface MuscleMassReportProps {
  muscleMassIncrease: number;
  populationSize?: number;
}

export const MuscleMassReport: React.FC<MuscleMassReportProps> = ({
  muscleMassIncrease,
  populationSize = 100000,
}) => {
  const [showCalculations, setShowCalculations] = useState(false);
  const model = new MuscleMassInterventionModel(muscleMassIncrease, populationSize);
  const metabolic = model.calculate_metabolic_impact();
  const health = model.calculate_health_outcomes();
  const economic = model.calculate_economic_impact(populationSize);

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

  return (
    <article className="prose prose-lg max-w-none">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold m-0">
          Muscle Mass Intervention Analysis Report
        </h1>
        <button
          onClick={() => setShowCalculations(!showCalculations)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showCalculations ? 'Hide Calculations' : 'Show Calculations'}
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Generated on: {new Date().toLocaleDateString()}
      </p>

      {/* Intervention Details */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Intervention Details</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Muscle Mass Increase</p>
            <p className="text-xl">{muscleMassIncrease} lbs per person</p>
          </div>
          <div>
            <p className="font-medium">Target Population</p>
            <p className="text-xl">{formatNumber(populationSize, 0)} individuals</p>
          </div>
        </div>
      </section>

      {/* Metabolic Impact */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Metabolic Impact</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Additional Daily Calories Burned</p>
            <p className="text-xl">
              {formatNumber(metabolic.additional_daily_calories_burned, 1)} calories/day
            </p>
          </div>
          <div>
            <p className="font-medium">Annual Metabolic Impact</p>
            <p className="text-xl">
              {formatNumber(metabolic.annual_metabolic_impact, 0)} calories/year
            </p>
          </div>
        </div>
      </section>

      {/* Health Outcomes */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Health Outcomes</h2>
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Insulin Sensitivity Improvement</p>
            <p className="text-xl">{formatPercent(health.insulin_sensitivity_improvement)}</p>
          </div>
          <div>
            <p className="font-medium">Fall Risk Reduction</p>
            <p className="text-xl">{formatPercent(health.fall_risk_reduction)}</p>
          </div>
          <div>
            <p className="font-medium">Mortality Risk Reduction</p>
            <p className="text-xl">{formatPercent(health.mortality_reduction)}</p>
          </div>
        </div>
      </section>

      {/* Economic Impact */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Economic Impact (Annual)</h2>
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Healthcare Cost Savings</p>
            <p className="text-xl">{formatCurrency(economic.healthcare_savings)}</p>
          </div>
          <div>
            <p className="font-medium">Productivity Gains</p>
            <p className="text-xl">{formatCurrency(economic.productivity_gains)}</p>
          </div>
          <div>
            <p className="font-medium">Medicare Total Annual Spend Impact</p>
            <p className="text-xl">{formatCurrency(economic.medicare_spend_impact)}</p>
          </div>
          <div>
            <p className="font-medium">Total Economic Benefit</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(economic.total_economic_benefit)}
            </p>
          </div>
        </div>
      </section>

      {/* Detailed Calculations */}
      {showCalculations && (
        <MuscleMassCalculations
          muscleMassIncrease={muscleMassIncrease}
          populationSize={populationSize}
        />
      )}

      {/* Model Parameters */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Model Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(muscleMassParameters).map(([key, param]) => (
            <div key={key} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{param.emoji}</span>
                <h3 className="font-medium">{param.displayName}</h3>
              </div>
              <p className="text-gray-600 mb-2">{param.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {param.defaultValue} {param.unitName}
                </span>
                <a
                  href={param.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Source →
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
            <li>All calculations use validated equations from peer-reviewed research</li>
            <li>Health outcomes are based on conservative estimates from meta-analyses</li>
            <li>Economic impact includes direct healthcare savings and indirect productivity gains</li>
            <li>Risk reductions are calculated using linear scaling with established upper bounds</li>
          </ul>
        </div>
      </section>

      {/* Limitations */}
      <section className="mt-8 mb-12">
        <h2 className="text-2xl font-semibold mb-4">Limitations</h2>
        <div className="p-4 bg-gray-50 rounded-lg">
          <ul className="list-disc pl-5 space-y-2">
            <li>Individual results may vary based on age, gender, and baseline health status</li>
            <li>Long-term adherence to muscle mass maintenance not considered</li>
            <li>Intervention costs not included in economic calculations</li>
            <li>Results are based on population-level statistics and may not reflect individual outcomes</li>
          </ul>
        </div>
      </section>
    </article>
  );
}; 