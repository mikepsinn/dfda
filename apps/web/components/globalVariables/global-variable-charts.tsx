"use client"

import * as React from "react"
import { FC, useEffect } from "react"
import Highcharts, { Options as HighchartsOptions, SeriesOptionsType } from "highcharts"
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
    enabled: true,
    shared: false,
    useHTML: false,
    formatter: function() {
      const point = this.point;
      return `<b>${point.name || point.category || ''}</b><br/>${this.series.name}: ${point.y}`;
    }
  },
  plotOptions: {
    series: {
      animation: false,
      states: {
        hover: {
          enabled: true
        }
      },
      point: {
        events: {}
      }
    },
    column: {
      pointPadding: 0.2,
      borderWidth: 0
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

  const getChartOptions = (config: Partial<HighchartsOptions> | undefined): HighchartsOptions | null => {
    if (!config) return null
    
    try {
      const mergedOptions: HighchartsOptions = {
        ...defaultChartOptions,
        ...config,
        chart: {
          ...defaultChartOptions.chart,
          ...config.chart,
          animation: false
        },
        tooltip: {
          enabled: true,
          shared: false,
          useHTML: false,
          formatter: function() {
            const point = this.point;
            return `<b>${point.name || point.category || ''}</b><br/>${this.series.name}: ${point.y}`;
          }
        },
        plotOptions: {
          ...defaultChartOptions.plotOptions,
          ...config.plotOptions,
          series: {
            ...defaultChartOptions.plotOptions?.series,
            ...config.plotOptions?.series,
            animation: false,
            states: {
              hover: {
                enabled: true
              }
            },
            point: {
              events: {}
            }
          }
        }
      }

      // Validate that required properties exist and data is properly formatted
      if (!mergedOptions.series || !Array.isArray(mergedOptions.series)) {
        console.warn('Invalid series configuration, using default')
        return defaultChartOptions
      }

      // Ensure each series has valid data
      mergedOptions.series = mergedOptions.series.map((series: SeriesOptionsType) => {
        const validData = Array.isArray((series as any).data) ? 
          (series as any).data.map((point: any) => {
            if (typeof point === 'number') {
              return point;
            }
            if (typeof point === 'object' && point !== null) {
              return {
                ...point,
                y: typeof point.y === 'number' ? point.y : 0,
                name: point.name || '',
                category: point.category || ''
              }
            }
            return 0;
          }) : [];

        return {
          ...series,
          data: validData
        };
      });

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
