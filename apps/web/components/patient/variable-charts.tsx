'use client'

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import type { DailyValue } from 'analysis'
import type { DistributionBin, WeekdayAverage } from '@/lib/patient/variable-stats'
import { aggregateText } from '@/lib/patient/value-text'
import { getRatingRange, getVariableInputType } from '@/lib/variable-helpers'

const config = { value: { label: 'Value', color: 'hsl(var(--primary))' } } satisfies ChartConfig

type Unit = { id: string; abbreviatedName: string }

const DAY_MS = 86_400_000
/** A local day (YYYY-MM-DD) as a time on the chart's axis, so that days are spaced by the time between them. */
const timeOf = (day: string) => Date.parse(`${day}T00:00:00Z`)
const dayLabel = (day: string | number, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(typeof day === 'number' ? new Date(day) : new Date(`${day}T12:00:00Z`))

function Tip({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">{title}</p>
      {lines.map((line) => <p key={line} className="text-muted-foreground">{line}</p>)}
    </div>
  )
}

function ChartCard({ title, description, label, children, table }: {
  title: string
  description: string
  label: string
  children: React.ReactNode
  table: React.ReactNode
}) {
  return (
    <Card className="space-y-3 p-4 sm:p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div role="img" aria-label={label}>{children}</div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show the numbers</summary>
        <div className="mt-2 max-h-72 overflow-auto">{table}</div>
      </details>
    </Card>
  )
}

function Table({ head, rows }: { head: [string, string]; rows: [string, string][] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="border-b text-left text-muted-foreground"><th className="py-1 pr-4 font-medium">{head[0]}</th><th className="py-1 font-medium">{head[1]}</th></tr></thead>
      <tbody>{rows.map(([a, b]) => <tr key={a} className="border-b last:border-0"><td className="py-1 pr-4">{a}</td><td className="py-1 tabular-nums">{b}</td></tr>)}</tbody>
    </table>
  )
}

const axis = { tickLine: false, axisLine: false, tickMargin: 8 } as const

/**
 * The charts of QuantiModo's variable page, for one variable: its daily values
 * over time, how many days had each value, and the average on each weekday.
 * One series each, in the theme's primary color; the title names it.
 */
export function VariableCharts({ name, unit, daily, distribution, weekdays }: {
  name: string
  unit: Unit
  daily: DailyValue[]
  distribution: DistributionBin[]
  weekdays: WeekdayAverage[]
}) {
  const shown = (value: number) => aggregateText(value, unit)
  const dots = daily.length <= 45
  // A rating's axis keeps to whole points of its scale.
  const rating = getRatingRange(getVariableInputType({ unitId: unit.id, variableCategory: null })) !== null
  // Days without a measurement are left out of ratings and readings, so the axis is time, not the list of days.
  const points = daily.map((d) => ({ ...d, t: timeOf(d.day) }))
  const first = points[0]?.t ?? 0
  const last = points[points.length - 1]?.t ?? 0
  const domain = first === last ? [first - DAY_MS, last + DAY_MS] : [first, last]
  const measuredWeekdays = weekdays.filter((w) => w.average !== null)
  return (
    <div className="space-y-6">
      <ChartCard
        title="Daily values"
        description={`${name} each day, ${unit.abbreviatedName ? `in ${unit.abbreviatedName}` : 'as recorded'}.`}
        label={`Line chart of ${name} on ${daily.length} days, from ${shown(Math.min(...daily.map((d) => d.value)))} to ${shown(Math.max(...daily.map((d) => d.value)))}.`}
        table={<Table head={['Day', name]} rows={[...daily].reverse().map((d) => [dayLabel(d.day, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }), `${shown(d.value)}${d.filled ? ' (no measurement)' : ''}`])} />}
      >
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <LineChart data={points} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="t" type="number" scale="time" domain={domain} {...axis} minTickGap={32}
              tickFormatter={(t: number) => dayLabel(t, { month: 'short', day: 'numeric' })} />
            <YAxis {...axis} width={44} domain={['auto', 'auto']} allowDecimals={!rating} />
            <ChartTooltip
              cursor={{ strokeWidth: 1 }}
              content={({ active, payload }) => {
                const point = active ? (payload?.[0]?.payload as DailyValue | undefined) : undefined
                if (!point) return null
                return <Tip title={dayLabel(point.day, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  lines={[point.filled ? `${shown(point.value)}, no measurement` : shown(point.value)]} />
              }}
            />
            <Line dataKey="value" type="linear" stroke="var(--color-value)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              dot={dots ? { r: 4, fill: 'var(--color-value)', stroke: 'hsl(var(--background))', strokeWidth: 2 } : false}
              activeDot={{ r: 5, fill: 'var(--color-value)', stroke: 'hsl(var(--background))', strokeWidth: 2 }} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="How often each value occurs"
          description="The number of days with each daily value."
          label={`Bar chart of the number of days with each daily value of ${name}.`}
          table={<Table head={['Daily value', 'Days']} rows={distribution.map((bin) => [bin.from === bin.to ? shown(bin.from) : `${bin.label} ${unit.abbreviatedName}`, String(bin.days)])} />}
        >
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <BarChart data={distribution} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
              <YAxis {...axis} width={32} allowDecimals={false} />
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  const bin = active ? (payload?.[0]?.payload as DistributionBin | undefined) : undefined
                  if (!bin) return null
                  return <Tip title={bin.from === bin.to ? shown(bin.from) : `${bin.label} ${unit.abbreviatedName}`} lines={[`${bin.days} ${bin.days === 1 ? 'day' : 'days'}`]} />
                }}
              />
              <Bar dataKey="days" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard
          title="Average by weekday"
          description="The average daily value on each day of the week."
          label={`Bar chart of the average daily ${name} on each weekday, from Monday to Sunday.`}
          table={<Table head={['Weekday', 'Average']} rows={weekdays.map((w) => [w.weekday, w.average === null ? 'No values' : `${shown(w.average)} (${w.days} ${w.days === 1 ? 'day' : 'days'})`])} />}
        >
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <BarChart data={weekdays} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="weekday" {...axis} />
              <YAxis {...axis} width={44} domain={measuredWeekdays.length ? [0, 'auto'] : [0, 1]} />
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  const day = active ? (payload?.[0]?.payload as WeekdayAverage | undefined) : undefined
                  if (!day) return null
                  return <Tip title={day.weekday} lines={[day.average === null ? 'No values' : `${shown(day.average)} on average`, `${day.days} ${day.days === 1 ? 'day' : 'days'}`]} />
                }}
              />
              <Bar dataKey="average" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>
    </div>
  )
}
