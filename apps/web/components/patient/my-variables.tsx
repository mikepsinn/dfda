import Link from 'next/link'
import { Bell, PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { MyVariable, MyVariableSection } from '@/lib/patient/reminders'

const SECTIONS: { id: MyVariableSection; title: string }[] = [
  { id: 'as-needed', title: 'As-needed' },
  { id: 'scheduled', title: 'Scheduled' },
  { id: 'archived', title: 'Archived' },
]

const BACK = encodeURIComponent('/patient/user-variables')

function Row({ variable }: { variable: MyVariable }) {
  const archived = variable.section === 'archived'
  return (
    <li className="flex items-center gap-3 px-4 py-2">
      <span aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg ${archived ? 'opacity-60' : ''}`}>
        {variable.emoji ?? variable.name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <Link href={`/patient/user-variables/${variable.userVariableId}`}
          className="break-words font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">
          {variable.name}
        </Link>
        <p className="text-sm text-muted-foreground">{variable.description}</p>
      </div>
      <Button asChild variant="ghost" size="icon" className="h-11 w-11 shrink-0">
        <Link href={`/patient/measurements/new?variableId=${encodeURIComponent(variable.globalVariableId)}&returnTo=${BACK}`}
          aria-label={`Record ${variable.name}`} title="Record a measurement">
          <PencilLine aria-hidden="true" className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" className="h-11 w-11 shrink-0">
        <Link href={`/patient/reminders/${variable.userVariableId}?returnTo=${BACK}`}
          aria-label={`Reminder settings for ${variable.name}`} title="Reminder settings">
          <Bell aria-hidden="true" className="h-4 w-4" />
        </Link>
      </Button>
    </li>
  )
}

/**
 * QuantiModo's My Variables list: the person's variables under As-needed,
 * Scheduled and Archived, each with its reminders in words and buttons to
 * record a value or change the reminder.
 */
export function MyVariables({ variables, filtered }: { variables: MyVariable[]; filtered: boolean }) {
  if (variables.length === 0) {
    return (
      <Card className="space-y-4 p-6 text-center">
        <p className="text-muted-foreground">
          {filtered ? 'You have no variables in this category.' : 'You have no variables yet. Add a reminder or record a measurement to start.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline" className="gap-1.5"><Link href="/patient/reminders/new"><Bell aria-hidden="true" className="h-4 w-4" />Add a reminder</Link></Button>
          <Button asChild variant="outline" className="gap-1.5"><Link href="/patient/measurements/new"><PencilLine aria-hidden="true" className="h-4 w-4" />Record a measurement</Link></Button>
        </div>
      </Card>
    )
  }
  return (
    <div className="space-y-6">
      {SECTIONS.map(({ id, title }) => {
        const items = variables.filter((variable) => variable.section === id)
        if (items.length === 0) return null
        return (
          <section key={id} aria-labelledby={`my-variables-${id}`} className="space-y-2">
            <h2 id={`my-variables-${id}`} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {title} <span className="font-normal">({items.length})</span>
            </h2>
            <ul className="divide-y rounded-lg border">
              {items.map((variable) => <Row key={variable.userVariableId} variable={variable} />)}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
