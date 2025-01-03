import React from 'react';
import { MuscleMassInterventionModel } from '@/lib/health-econ-simulation/outcomes/muscle-mass-model';
import { muscleMassParameters } from '@/lib/health-econ-simulation/outcomes/muscle-mass-parameters';

interface MuscleMassCalculationsProps {
  muscleMassIncrease: number;
  populationSize: number;
}

export const MuscleMassCalculations: React.FC<MuscleMassCalculationsProps> = ({
  muscleMassIncrease,
  populationSize,
}) => {
  const model = new MuscleMassInterventionModel(muscleMassIncrease, populationSize);
  const metabolic = model.calculate_metabolic_impact();
  const health = model.calculate_health_outcomes();
  const economic = model.calculate_economic_impact(populationSize);

  // Helper functions for formatting
  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatPercent = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Calculate additional values for detailed explanations
  const fall_reduction = health.fall_risk_reduction;
  const prevented_falls = muscleMassParameters.fall_risk.defaultValue * fall_reduction * populationSize;
  const fall_cost_savings = prevented_falls * 10000;
  const total_productivity_gain = muscleMassIncrease * 100 * populationSize;
  const qalys_gained = muscleMassIncrease * 0.02 * populationSize;
  const discount_rate = muscleMassParameters.discount_rate.defaultValue;
  const discount_factor = (1 - Math.pow(1 + discount_rate, -10)) / discount_rate;
  const long_term_savings = (fall_cost_savings + total_productivity_gain) * discount_factor;

  return (
    <div className="prose prose-lg max-w-none">
      <h2 className="text-2xl font-semibold mb-4">Model Calculations Explained</h2>

      {/* Metabolic Impact Calculations */}
      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Metabolic Impact Calculations</h3>
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium">Daily Calorie Burn</h4>
            <p className="text-sm text-gray-600">Formula: Muscle Mass Increase × {muscleMassParameters.muscle_calorie_burn.defaultValue} calories/lb/day</p>
            <p className="text-sm text-gray-600">
              Example: {muscleMassIncrease} lbs × {muscleMassParameters.muscle_calorie_burn.defaultValue} = {formatNumber(metabolic.additional_daily_calories_burned, 1)} calories/day
            </p>
          </div>
          <div>
            <h4 className="font-medium">Annual Metabolic Impact</h4>
            <p className="text-sm text-gray-600">Formula: Daily Calories × 365 days</p>
            <p className="text-sm text-gray-600">
              Example: {formatNumber(metabolic.additional_daily_calories_burned, 1)} × 365 = {formatNumber(metabolic.annual_metabolic_impact, 0)} calories/year
            </p>
          </div>
        </div>
      </section>

      {/* Health Outcomes Calculations */}
      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Health Outcomes Calculations</h3>
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium">Insulin Sensitivity Improvement</h4>
            <p className="text-sm text-gray-600">Formula: Muscle Mass Increase × 0.02 (2% improvement per lb)</p>
            <p className="text-sm text-gray-600">
              Example: {muscleMassIncrease} × 0.02 = {formatPercent(health.insulin_sensitivity_improvement)}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Fall Risk Reduction</h4>
            <p className="text-sm text-gray-600">Formula: min(30%, Muscle Mass Increase × 1.5%)</p>
            <p className="text-sm text-gray-600">
              Example: min(30%, {muscleMassIncrease} × 1.5%) = {formatPercent(health.fall_risk_reduction)}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Mortality Risk Reduction</h4>
            <p className="text-sm text-gray-600">Formula: min(20%, Muscle Mass Increase × 1%)</p>
            <p className="text-sm text-gray-600">
              Example: min(20%, {muscleMassIncrease} × 1%) = {formatPercent(health.mortality_reduction)}
            </p>
          </div>
        </div>
      </section>

      {/* Economic Impact Calculations */}
      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Economic Impact Calculations</h3>
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium">Healthcare Savings from Fall Prevention</h4>
            <p className="text-sm text-gray-600">Formula:</p>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              <li>Prevented Falls = Baseline Fall Risk × Fall Risk Reduction × Population</li>
              <li>Savings = Prevented Falls × $10,000 (avg. fall cost)</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              Example:<br />
              {formatNumber(muscleMassParameters.fall_risk.defaultValue, 3)} × {formatNumber(fall_reduction, 3)} × {formatNumber(populationSize, 0)} = {formatNumber(prevented_falls, 0)} falls prevented<br />
              {formatNumber(prevented_falls, 0)} × $10,000 = {formatCurrency(fall_cost_savings)}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Productivity Gains</h4>
            <p className="text-sm text-gray-600">Formula: Muscle Mass Increase × $100/lb × Population</p>
            <p className="text-sm text-gray-600">
              Example: {muscleMassIncrease} × $100 × {formatNumber(populationSize, 0)} = {formatCurrency(total_productivity_gain)}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Quality-Adjusted Life Years (QALYs)</h4>
            <p className="text-sm text-gray-600">Formula: Muscle Mass Increase × 0.02 QALYs/lb × Population</p>
            <p className="text-sm text-gray-600">
              Example: {muscleMassIncrease} × 0.02 × {formatNumber(populationSize, 0)} = {formatNumber(qalys_gained, 0)} QALYs
            </p>
          </div>
          <div>
            <h4 className="font-medium">Long-Term Savings (10-Year Projection)</h4>
            <p className="text-sm text-gray-600">Formula: (Annual Savings + Productivity Gains) × Discount Factor</p>
            <p className="text-sm text-gray-600">Where Discount Factor = (1 - (1 + r)^-10) / r, r = {formatPercent(discount_rate)} discount rate</p>
            <p className="text-sm text-gray-600">
              Example: ({formatCurrency(fall_cost_savings)} + {formatCurrency(total_productivity_gain)}) × {formatNumber(discount_factor, 2)} = {formatCurrency(long_term_savings)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}; 