import React, { useState } from 'react';
import { MuscleMassInterventionModel } from '@/lib/health-econ-simulation/outcomes/muscle-mass-model';
import { OutcomeMetric } from '@/lib/health-econ-simulation/outcomes/muscle-mass-outcome-metrics';
import { metabolicOutcomeMetrics } from '@/lib/health-econ-simulation/outcomes/muscle-mass/metabolic-metrics';
import { healthOutcomeMetrics } from '@/lib/health-econ-simulation/outcomes/muscle-mass/health-metrics';
import { economicOutcomeMetrics } from '@/lib/health-econ-simulation/outcomes/muscle-mass/economic-metrics';
import { WorkInProgressDisclaimer } from './WorkInProgressDisclaimer';
import { reportSections } from '@/lib/health-econ-simulation/report-config';
import { generateMuscleMassReportData } from '@/lib/health-econ-simulation/report-utils';
import { generateMarkdownReport } from '@/lib/health-econ-simulation/report-generator';
import { Download, Copy, Check, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MuscleMassReportProps {
  muscleMassIncreasePerPerson: number;
  populationSize?: number;
}

export const MuscleMassReport: React.FC<MuscleMassReportProps> = ({
  muscleMassIncreasePerPerson,
  populationSize = 100000,
}) => {
  const [copied, setCopied] = useState(false);
  const model = new MuscleMassInterventionModel(muscleMassIncreasePerPerson, { 
    population_size: populationSize 
  });
  const metabolic = model.calculate_metabolic_impact();
  const health = model.calculate_health_outcomes();
  const economic = model.calculate_economic_impact();

  // Helper function for number formatting (only used for population size display)
  const formatNumber = (num: number, decimals: number = 2) => new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);

  // Helper function to generate and handle the report
  const generateReport = () => {
    const reportData = generateMuscleMassReportData(model);
    return generateMarkdownReport(reportData);
  };

  // Handle report download
  const handleDownload = () => {
    const markdown = generateReport();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muscle-mass-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    const markdown = generateReport();
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper function to render a metric with its metadata and calculation
  const renderMetric = (value: number, metric: OutcomeMetric) => {
    const sensitivity = metric.calculateSensitivity(muscleMassIncreasePerPerson, { ...model.baselineMetrics, population_size: populationSize });
    
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
            __html: metric.generateCalculationExplanation(muscleMassIncreasePerPerson, { ...model.baselineMetrics, population_size: populationSize })
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
    <>
      <WorkInProgressDisclaimer></WorkInProgressDisclaimer>
      <article className="max-w-none">
        {/* Report Actions */}
        <div className="flex justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
              <MoreVertical className="w-4 h-4" />
              Export
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
                <Download className="w-4 h-4 mr-2" />
                Download as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Intervention Details */}
        <section className="mt-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Intervention Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Muscle Mass Increase</p>
              <p className="text-lg sm:text-xl">{muscleMassIncreasePerPerson} lbs per person</p>
            </div>
            <div>
              <p className="font-medium">Target Population</p>
              <p className="text-lg sm:text-xl">{formatNumber(populationSize, 0)} individuals</p>
            </div>
          </div>
        </section>

        {/* Economic Impact */}
        <section className="mt-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Economic Impact</h2>
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
          <h2 className="text-2xl font-semibold mb-4">{reportSections.methodology.title}</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <ul className="list-disc pl-5 space-y-2">
              {reportSections.methodology.points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Limitations */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">{reportSections.limitations.title}</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <ul className="list-disc pl-5 space-y-2">
              {reportSections.limitations.points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Statistical Validation */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">{reportSections.statisticalValidation.title}</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="mb-4">{reportSections.statisticalValidation.description}</p>
            <ul className="list-disc pl-5 space-y-2">
              {reportSections.statisticalValidation.points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
              <li>
                {reportSections.statisticalValidation.covariates.title}
                <ul className="list-circle pl-5 mt-2">
                  {reportSections.statisticalValidation.covariates.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        </section>

        {/* Metabolic Impact */}
        <section className="mt-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            Metabolic Impact
          </h2>      
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
      </article>
    </>
  );
}; 