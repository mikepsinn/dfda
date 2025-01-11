'use client'

import Highcharts, { Options as HighchartsOptions } from "highcharts"
import HighchartsReact from 'highcharts-react-official'
import { Chart } from '@/types/models/Chart'
import { useState } from 'react'
import React from 'react'

interface StudyCharts {
  populationTraitScatterPlot?: Chart
  outcomeDistributionColumnChart?: Chart
  predictorDistributionColumnChart?: Chart
  correlationScatterPlot?: Chart
  pairsOverTimeLineChart?: Chart
}

interface StudyChartsProps {
  studyCharts: StudyCharts
}

const defaultChartConfig: Partial<HighchartsOptions> = {
  chart: {
    type: 'scatter'
  },
  tooltip: {
    enabled: true
  },
  xAxis: {
    crosshair: false
  },
  yAxis: {
    crosshair: false
  }
}

export default function StudyCharts({ studyCharts }: StudyChartsProps) {
  const [chartErrors, setChartErrors] = useState<Record<string, boolean>>({})

  const validateAndEnhanceConfig = (config: any): HighchartsOptions | null => {
    try {
      // Basic validation
      if (!config || typeof config !== 'object') return null
      
      // Check for required properties
      const requiredProps = ['series', 'chart']
      for (const prop of requiredProps) {
        if (!(prop in config)) return null
      }

      // Merge with default config to ensure required properties exist
      const enhancedConfig = {
        ...defaultChartConfig,
        ...config,
        tooltip: {
          ...defaultChartConfig.tooltip,
          ...config.tooltip
        },
        xAxis: {
          ...defaultChartConfig.xAxis,
          ...(typeof config.xAxis === 'object' ? config.xAxis : {})
        },
        yAxis: {
          ...defaultChartConfig.yAxis,
          ...(typeof config.yAxis === 'object' ? config.yAxis : {})
        }
      }

      return enhancedConfig as HighchartsOptions
    } catch (error) {
      console.error('Chart config validation error:', error)
      return null
    }
  }

  return (
    <div className="neobrutalist-container bg-white p-6 mb-8">
      <h2 className="neobrutalist-h2 mb-6">Study Data</h2>
      <div className="grid grid-cols-1 gap-8">
        {Object.entries(studyCharts).map(([key, chart]) => {
          if (!chart?.highchartConfig) return null;
          
          // Skip rendering if we've previously encountered an error with this chart
          if (chartErrors[key]) return null;

          const validConfig = validateAndEnhanceConfig(chart.highchartConfig)
          if (!validConfig) {
            console.error(`Invalid chart configuration for ${key}`)
            setChartErrors(prev => ({ ...prev, [key]: true }))
            return null;
          }
          
          return (
            <div key={key} className="item-text-wrap">
              {chart.chartTitle && (
                <h3 className="neobrutalist-h3 mb-4">{chart.chartTitle}</h3>
              )}
              <div className="relative">
                <ErrorBoundary>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={validConfig}
                  />
                </ErrorBoundary>
              </div>
              {chart.explanation && (
                <p className="neobrutalist-p mt-4">{chart.explanation}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Chart rendering error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500 bg-red-50 rounded">
          Failed to load chart. Please try again later.
        </div>
      )
    }

    return this.props.children
  }
} 