"use client"

import * as React from "react"
import { FC, useEffect } from "react"
import Highcharts, { Options as HighchartsOptions } from "highcharts"
import HighchartsReact from "highcharts-react-official"

import { GlobalVariable } from "@/types/models/GlobalVariable"
// TODO: Fix highcharts accessibility
// import highchartsAccessibility from "highcharts/modules/accessibility";
// if (typeof window !== undefined) {
//   highchartsAccessibility(Highcharts);
// }

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const defaultChartOptions: HighchartsOptions = {
  chart: {
    animation: false,
    type: 'line'
  },
  title: {
    text: 'No Data Available'
  },
  xAxis: {
    type: 'category',
    crosshair: false,
    title: {
      text: null
    }
  },
  yAxis: {
    title: {
      text: null
    }
  },
  tooltip: {
    enabled: true
  },
  plotOptions: {
    series: {
      animation: false
    }
  },
  series: [{
    type: 'line',
    name: 'No Data',
    data: []
  }],
  credits: {
    enabled: false
  }
}

interface GlobalVariableChartsProps
  extends React.HTMLAttributes<HTMLFormElement> {
  globalVariable: GlobalVariable
}

export const GlobalVariableCharts: FC<GlobalVariableChartsProps> = ({
  globalVariable,
}) => {
  useEffect(() => {
    console.log('Global Variable Data:', globalVariable)
    console.log('Line Chart Config:', globalVariable?.charts?.lineChartWithSmoothing?.highchartConfig)
    console.log('Monthly Chart Config:', globalVariable?.charts?.monthlyColumnChart?.highchartConfig)
    console.log('Weekday Chart Config:', globalVariable?.charts?.weekdayColumnChart?.highchartConfig)
  }, [globalVariable])

  const getChartOptions = (config: Partial<HighchartsOptions> | undefined): HighchartsOptions => {
    if (!config) return defaultChartOptions
    
    try {
      const mergedOptions: HighchartsOptions = {
        ...defaultChartOptions,
        ...config,
        chart: {
          ...defaultChartOptions.chart,
          ...config.chart,
          animation: false
        },
        plotOptions: {
          ...defaultChartOptions.plotOptions,
          ...config.plotOptions,
          series: {
            ...defaultChartOptions.plotOptions?.series,
            ...config.plotOptions?.series,
            animation: false
          }
        }
      }

      // Validate that required properties exist
      if (!mergedOptions.series || !Array.isArray(mergedOptions.series)) {
        console.warn('Invalid series configuration, using default')
        return defaultChartOptions
      }

      return mergedOptions
    } catch (error) {
      console.error('Error creating chart options:', error)
      return defaultChartOptions
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{globalVariable?.name}</CardTitle>
        {globalVariable?.description && (
          <CardDescription>{globalVariable.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent id="chart-card" className="space-y-4">
        <div className="card transparent-bg highcharts-container">
          <div className="mb-4">
            <HighchartsReact
              highcharts={Highcharts}
              options={getChartOptions(globalVariable?.charts?.lineChartWithSmoothing?.highchartConfig as Partial<HighchartsOptions>)}
            />
          </div>
          <div className="mb-4">
            <HighchartsReact
              highcharts={Highcharts}
              options={getChartOptions(globalVariable?.charts?.monthlyColumnChart?.highchartConfig as Partial<HighchartsOptions>)}
            />
          </div>
          <div className="mb-4">
            <HighchartsReact
              highcharts={Highcharts}
              options={getChartOptions(globalVariable?.charts?.weekdayColumnChart?.highchartConfig as Partial<HighchartsOptions>)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  )
}
