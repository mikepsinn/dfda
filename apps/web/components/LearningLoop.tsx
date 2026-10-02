import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ClipboardPen, RefreshCw, Scale, Stethoscope, TrendingUp } from "lucide-react"

// The landing page's picture of the network: each patient's results improve the evidence that the next
// patient starts from. It shows the planned design, not live data.
const steps = [
  { title: "Compare", text: "You and your doctor see which treatments worked for people like you.", icon: Scale },
  { title: "Join", text: "You start one as part of your normal care, in a pragmatic trial.", icon: Stethoscope },
  { title: "Report", text: "You record how you feel, and your health records add the rest.", icon: ClipboardPen },
  { title: "Improve", text: "Your results update the rankings and Outcome Labels for the next patient.", icon: TrendingUp },
]

// From sm, the steps go clockwise around a 2 × 2 grid: top left, top right, bottom right, bottom left.
const placement = [
  "sm:col-start-1 sm:row-start-1",
  "sm:col-start-2 sm:row-start-1",
  "sm:col-start-2 sm:row-start-2",
  "sm:col-start-1 sm:row-start-2",
]

// The arrows sit in the 2.5rem gaps, at the middle of the rows and columns they connect.
const gridArrows = [
  { icon: ArrowRight, position: "left-1/2 top-[calc(25%-0.625rem)]" },
  { icon: ArrowDown, position: "left-[calc(75%+0.625rem)] top-1/2" },
  { icon: ArrowLeft, position: "left-1/2 top-[calc(75%+0.625rem)]" },
  { icon: ArrowUp, position: "left-[calc(25%-0.625rem)] top-1/2" },
]

export function LearningLoop() {
  return (
    <div className="rounded-xl border bg-background p-6 shadow-lg">
      <h2 className="text-xl font-bold">Every patient helps the next</h2>
      <div className="relative mt-6">
        <ol className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:grid-rows-2 sm:gap-10">
          {steps.map((step, index) => (
            <li
              key={step.title}
              // The steps light up in turn, unless the visitor asks for reduced motion.
              style={{ animationDelay: `${index * 2.5}s` }}
              className={`relative flex flex-col gap-2 rounded-lg border bg-card p-4 motion-safe:animate-loop-step ${placement[index]}`}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold tabular-nums text-primary">
                  {index + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <step.icon aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{step.text}</p>
              {/* Below sm the steps form a column, with an arrow to the next one. */}
              {index < steps.length - 1 && (
                <ArrowDown aria-hidden="true" className="absolute -bottom-7 left-1/2 h-5 w-5 -translate-x-1/2 text-primary sm:hidden" />
              )}
            </li>
          ))}
        </ol>
        {gridArrows.map(({ icon: Icon, position }) => (
          <Icon
            key={position}
            aria-hidden="true"
            className={`absolute hidden h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-primary sm:block ${position}`}
          />
        ))}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary p-2.5 text-primary-foreground shadow-md ring-4 ring-background sm:block"
        >
          <RefreshCw className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <RefreshCw aria-hidden="true" className="h-4 w-4 shrink-0 text-primary sm:hidden" />
        Then the next patient starts at step 1, with better evidence.
      </p>
    </div>
  )
}
