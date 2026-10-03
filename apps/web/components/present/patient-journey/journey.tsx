import Image from "next/image";
import {
  AlertTriangle, ArrowRight, Ban, BookOpen, Building2, CalendarClock, Check, ClipboardCheck, Clock, Eye, FileBarChart,
  FileText, FlaskConical, Layers, LineChart, Lock, PauseCircle, RefreshCw, Search, ShieldCheck, Star, Stethoscope,
  Users, Video,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { OutcomeLabel } from "@/components/OutcomeLabel";
import { TreatmentRankingCard } from "@/components/demo/treatment-ranking-card";
import { TreatmentScores } from "@/components/demo/treatment-scores";
import { treatmentOutcomeCategories } from "@/components/demo/treatment-outcomes";
import { TrackOutcomesPreview } from "@/components/how-it-works/steps/Step5TrackData";
import { Eyebrow, IconBadge, SlideFrame } from "@/components/present/slide";
import { rankTreatments, type DemoCondition, type TreatmentEstimate } from "@/lib/demo/treatment-estimates";
import type { ScriptSlide } from "@/lib/present/script";
import { cn } from "@/lib/utils";

type Props = { s: ScriptSlide };

function Bullets({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-3 text-[27px] leading-snug", className)}>
      {items.map(item => (
        <li key={item} className="flex gap-4"><span aria-hidden="true" className="mt-[15px] h-2 w-2 shrink-0 rounded-full bg-primary" />{item}</li>
      ))}
    </ul>
  );
}

function Tag({ children }: { children: string }) {
  return <span className="inline-flex rounded-full bg-amber-100 px-5 py-2 text-[20px] font-semibold text-amber-900">{children}</span>;
}

const exploreFeatures = [
  { icon: LineChart, title: "Rankings and outcome labels", text: "Compare benefits, side effects and costs." },
  { icon: Search, title: "Public directory", text: "Every participating clinic, with location and status." },
  { icon: ShieldCheck, title: "Pre-screened", text: "An independent board approves every treatment first." },
];

export function ExploreSlide({ s, condition }: Props & { condition: DemoCondition }) {
  const ranked = rankTreatments(condition.treatments, "effectiveness");
  return (
    <SlideFrame s={s}>
      <div className="flex items-center gap-8">
        <Tag>Prototype · preliminary estimates, not medical advice</Tag>
        <p className="text-[24px] text-muted-foreground">
          {condition.name}: the top 3 of {ranked.length} treatments by estimated effectiveness
        </p>
      </div>
      <ol className="mt-5 grid grid-cols-3 gap-6 [zoom:1.5]">
        {ranked.slice(0, 3).map((treatment, index) => (
          <li key={treatment.slug} className="min-w-0">
            <TreatmentRankingCard conditionSlug={condition.slug} treatment={treatment} rank={index + 1} sort="effectiveness" />
          </li>
        ))}
      </ol>
      <ul className="mt-8 grid grid-cols-3 gap-10">
        {exploreFeatures.map(feature => (
          <li key={feature.title} className="flex gap-6">
            <IconBadge icon={feature.icon} size={64} />
            <div>
              <h3 className="text-[28px] font-semibold leading-tight">{feature.title}</h3>
              <p className="mt-1 text-[23px] leading-snug text-muted-foreground">{feature.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </SlideFrame>
  );
}

const evidenceSources = [
  { icon: FlaskConical, title: "Clinical trials", text: "Published results, including failed trials" },
  { icon: Users, title: "Real-world outcomes", text: "Every patient treated in the system" },
  { icon: AlertTriangle, title: "Side-effect reports", text: "From clinics and adverse-event systems" },
  { icon: RefreshCw, title: "Updated as data arrives", text: "Each new result changes the label" },
];

export function LabelSlide({ s, treatment }: Props & { treatment: TreatmentEstimate }) {
  const [primary, , sideEffects] = treatmentOutcomeCategories(treatment);
  return (
    <SlideFrame s={s}>
      <div className="[zoom:1.08]">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-8 border-b pb-4">
            <div>
              <p className="text-2xl font-bold">{treatment.name}</p>
              <p className="text-sm text-muted-foreground">For Alzheimer's disease</p>
            </div>
            <div className="w-[420px]"><TreatmentScores effectiveness={treatment.effectiveness} safetyScore={treatment.safetyScore} /></div>
          </div>
          <div className="mt-4 grid grid-cols-[1.35fr_1fr] gap-8">
            <OutcomeLabel title="" data={[primary]} showBars={false} className="max-w-none border-0 p-0" />
            <OutcomeLabel title="" data={[sideEffects]} showBars={false} className="max-w-none border-0 p-0" />
          </div>
        </Card>
        <p className="mt-2 text-sm text-muted-foreground">Lecanemab's label in the prototype, from its FDA label and published trial.</p>
      </div>
      <Eyebrow className="mt-5">Where the evidence comes from</Eyebrow>
      <ul className="mt-4 grid grid-cols-4 gap-8">
        {evidenceSources.map(source => (
          <li key={source.title} className="flex gap-5">
            <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <source.icon className="h-7 w-7" />
            </span>
            <div>
              <h3 className="text-[26px] font-semibold leading-tight">{source.title}</h3>
              <p className="mt-1 text-[21px] leading-snug text-muted-foreground">{source.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </SlideFrame>
  );
}

const review = [
  { icon: Users, title: "Who reviews", items: ["A physician, an outcomes researcher and an ethicist", "No financial ties to the clinic or maker", "Flat fees, never paid per approval"] },
  { icon: Search, title: "What they check", items: ["The evidence", "The treatment plan", "Each provider's competence", "Conflicts of interest", "The consent form"] },
  { icon: ClipboardCheck, title: "What qualifies", items: ["Passed Phase I or similar", "A documented human safety record", "A well-studied platform therapy", "Device evidence"] },
];

export function ReviewSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <div className="grid h-full grid-cols-3 gap-10">
        {review.map(column => (
          <Card key={column.title} className="p-12">
            <div className="flex items-center gap-5">
              <IconBadge icon={column.icon} size={64} />
              <h3 className="text-[36px] font-semibold">{column.title}</h3>
            </div>
            <Bullets items={column.items} className="mt-8" />
          </Card>
        ))}
      </div>
    </SlideFrame>
  );
}

export function DoctorSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <div className="grid h-full grid-cols-[1.05fr_1fr_1fr] gap-10">
        <Card aria-hidden="true" className="flex flex-col overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b px-6 py-4 text-[22px] font-medium text-muted-foreground">
            <Video className="h-6 w-6 text-primary" /> Video visit
          </div>
          <div className="relative flex flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/10 to-muted">
            <IconBadge icon={Stethoscope} size={150} tone="solid" />
            <p className="text-[28px] font-semibold">Her neurologist</p>
            <div className="absolute bottom-6 right-6 flex flex-col items-center gap-2 rounded-xl border bg-background p-4 shadow-lg">
              <Image src="/present/margaret.png" alt="" width={96} height={96} className="rounded-full bg-primary/10" />
              <span className="text-[20px] font-medium">Margaret</span>
            </div>
          </div>
        </Card>
        <Card className="border-primary/30 bg-primary/10 p-12">
          <div className="flex items-center gap-5"><IconBadge icon={Check} size={64} tone="solid" /><h3 className="text-[38px] font-semibold">Required</h3></div>
          <Bullets className="mt-8" items={["Her treating doctor's recommendation", "Her written consent (e-sign is fine)", "Can happen by telemedicine"]} />
        </Card>
        <Card className="p-12">
          <div className="flex items-center gap-5">
            <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Ban className="h-8 w-8" /></span>
            <h3 className="text-[38px] font-semibold">Not required</h3>
          </div>
          <Bullets className="mt-8" items={["A specific diagnosis", "Medical necessity", "Minimum severity", "Terminal illness", "Trial ineligibility", "Trying approved drugs"]} />
        </Card>
      </div>
    </SlideFrame>
  );
}

const consentItems = [
  "The exact treatment", "Her doctor's view of realistic outcomes", "Other options, including none",
  "Known risks and benefits", "What's unknown, and FDA status", "Her choice is voluntary",
  "Who pays, and what she may owe", "What data is collected, and how it's coded", "A clear \"experimental\" statement",
];

export function ConsentSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <Card className="p-12">
        <p className="flex items-center gap-4 text-[22px] font-semibold uppercase tracking-[0.12em] text-primary">
          <FileText aria-hidden="true" className="h-7 w-7" /> Consent form · Experimental treatment
        </p>
        <ol className="mt-10 grid grid-cols-3 gap-x-12 gap-y-10">
          {consentItems.map((item, index) => (
            <li key={item} className="flex gap-5 text-[30px] leading-snug">
              <span className="w-8 shrink-0 font-bold text-primary tabular-nums">{index + 1}</span>{item}
            </li>
          ))}
        </ol>
      </Card>
      <ul className="mt-10 flex gap-6">
        {[{ icon: Video, text: "Recording only if she agrees" }, { icon: Users, text: "Family can consent for her" }, { icon: Lock, text: "Kept on file" }].map(chip => (
          <li key={chip.text} className="flex items-center gap-4 rounded-full border bg-card px-8 py-4 text-[26px] shadow-sm">
            <chip.icon aria-hidden="true" className="h-7 w-7 text-primary" />{chip.text}
          </li>
        ))}
      </ul>
    </SlideFrame>
  );
}

export function PaymentSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <div className="grid h-full grid-cols-[1fr_1.1fr] gap-12">
        <Card className="flex flex-col justify-center p-16">
          <p className="text-[200px] font-bold leading-none tracking-tight text-primary">$0</p>
          <p className="mt-8 text-[40px] font-semibold leading-tight">required from any insurer or state program</p>
          <p className="mt-6 text-[30px] leading-snug text-muted-foreground">Patients, families, charities, employers or research sponsors pay.</p>
        </Card>
        <div className="flex flex-col gap-10">
          <Card className="flex-1 bg-muted/70 p-12">
            <Eyebrow className="text-muted-foreground">Right to Try today</Eyebrow>
            <div className="mt-6 flex items-baseline gap-6">
              <span className="text-[110px] font-bold leading-none text-amber-500">21</span>
              <p className="text-[30px] leading-snug">drugs used from 2018 to 2024. Makers may charge only their costs, so almost no one offers it.</p>
            </div>
          </Card>
          <Card className="flex-1 border-primary/30 bg-primary/10 p-12">
            <Eyebrow>Care-integrated trials</Eyebrow>
            <p className="mt-6 text-[36px] font-semibold leading-snug">Clinics can charge a fair price, so they have a real reason to offer new treatments.</p>
          </Card>
        </div>
      </div>
    </SlideFrame>
  );
}

const clinicRecords = [
  "A coded ID, not her name", "Her goal and starting condition", "Treatment, dose and dates", "Outcomes on a set schedule",
  "Better, same, worse, stopped or died", "Side effects", "Missed follow-ups, and why",
];

export function TrackingSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <div className="grid h-full grid-cols-[1fr_1.35fr] gap-12">
        <Card className="p-12">
          <h3 className="text-[36px] font-semibold">What her clinic records</h3>
          <ol className="mt-8 space-y-4">
            {clinicRecords.map((item, index) => (
              <li key={item} className="flex gap-5 text-[28px] leading-snug">
                <span className="w-7 shrink-0 font-bold text-primary tabular-nums">{index + 1}</span>{item}
              </li>
            ))}
          </ol>
        </Card>
        <Card className="flex flex-col border-primary/30 bg-primary/10 p-12">
          <Eyebrow>Optional · Easier tracking</Eyebrow>
          <div className="mt-6 grid flex-1 grid-cols-[1fr_1fr] items-center gap-10">
            <div className="[zoom:1.25]"><TrackOutcomesPreview /></div>
            <Bullets items={["Daily phone check-ins", "Wearables sync automatically", "AI assistant calls or texts", "Reminders for labs and visits"]} />
          </div>
          <p className="mt-6 text-[26px] font-semibold">No required app or vendor. Normal medical records count.</p>
        </Card>
      </div>
    </SlideFrame>
  );
}

const safetySteps = [
  { icon: AlertTriangle, title: "Serious side effect", text: "Reported to the board within days." },
  { icon: Eye, title: "Board reassesses", text: "Also if a trial elsewhere stops for safety." },
  { icon: PauseCircle, title: "New patients paused", text: "Unresolved serious toxicity halts new starts." },
  { icon: ShieldCheck, title: "Careful continuation", text: "Current patients may continue if safer." },
];

export function SafetySlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <ol className="grid grid-cols-[1fr_48px_1fr_48px_1fr_48px_1fr] items-stretch">
        {safetySteps.map((step, index) => [
          <li key={step.title}>
            <Card className="h-full p-10">
              <div className="flex items-center justify-between">
                <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700"><step.icon className="h-8 w-8" /></span>
                <span className="text-[34px] font-bold text-primary/60 tabular-nums">{index + 1}</span>
              </div>
              <h3 className="mt-8 text-[34px] font-semibold leading-tight">{step.title}</h3>
              <p className="mt-3 text-[27px] leading-snug text-muted-foreground">{step.text}</p>
            </Card>
          </li>,
          index < safetySteps.length - 1 && (
            <li key={`${step.title}-arrow`} aria-hidden="true" className="flex"><ArrowRight className="m-auto h-9 w-9 text-amber-500" /></li>
          ),
        ])}
      </ol>
      <div className="dark mt-12 flex items-center gap-6 rounded-2xl bg-background px-12 py-9 text-foreground">
        <Clock aria-hidden="true" className="h-10 w-10 text-amber-400" />
        <p className="text-[34px] font-semibold">Every protocol is also reviewed at least once a year.</p>
      </div>
    </SlideFrame>
  );
}

const report = [
  { label: "Improved", count: 21, percent: 44, color: "bg-primary" },
  { label: "No real change", count: 14, percent: 29, color: "bg-primary/50" },
  { label: "Worsened", count: 6, percent: 13, color: "bg-amber-400" },
  { label: "Stopped", count: 4, percent: 8, color: "bg-amber-600" },
  { label: "Died", count: 0, percent: 0, color: "bg-slate-500" },
  { label: "Lost to follow-up", count: 3, percent: 6, color: "bg-slate-400" },
  { label: "Serious side effects", count: 2, percent: 4, color: "bg-amber-700" },
];

export function ResultsSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <div className="grid h-full grid-cols-[1.6fr_1fr] gap-12">
        <Card className="p-12">
          <Eyebrow>Example annual board report · 48 patients</Eyebrow>
          <dl className="mt-10 space-y-6">
            {report.map(row => (
              <div key={row.label} className="grid grid-cols-[320px_1fr_150px] items-center gap-6 text-[28px]">
                <dt>{row.label}</dt>
                <dd aria-hidden="true" className="h-7 rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", row.color)} style={{ width: `${Math.max(row.percent / 44 * 100, 1.5)}%` }} />
                </dd>
                <dd className="text-right font-semibold tabular-nums">{row.count} · {row.percent}%</dd>
              </div>
            ))}
          </dl>
        </Card>
        <div className="flex flex-col gap-10">
          {[{ icon: Eye, title: "Nothing hidden", text: "Bad, null and unclear results must be published." },
            { icon: Lock, title: "Privacy first", text: "Tiny groups combined for privacy." }].map(card => (
            <Card key={card.title} className="flex-1 p-12">
              <IconBadge icon={card.icon} size={64} />
              <h3 className="mt-6 text-[36px] font-semibold">{card.title}</h3>
              <p className="mt-3 text-[28px] leading-snug text-muted-foreground">{card.text}</p>
            </Card>
          ))}
        </div>
      </div>
    </SlideFrame>
  );
}

const pipeline = [
  { icon: Building2, title: "Her clinic", text: "Data stays with her doctor" },
  { icon: FileText, title: "Outcome report", text: "Coded and de-identified" },
  { icon: FileBarChart, title: "Board report", text: "Yearly public results" },
  { icon: Layers, title: "Evidence system", text: "Combines all clinics" },
  { icon: Star, title: "Rankings and outcome labels", text: "Compare benefits and harms" },
];

export function PipelineSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <ol className="grid grid-cols-[1fr_48px_1fr_48px_1fr_48px_1fr_48px_1fr] items-stretch">
        {pipeline.map((box, index) => {
          const last = index === pipeline.length - 1;
          return [
            <li key={box.title}>
              <Card className={cn("h-full p-9", last && "border-primary bg-primary text-primary-foreground")}>
                <IconBadge icon={box.icon} size={64} tone={last ? "highlight" : "soft"} />
                <h3 className="mt-6 text-[30px] font-semibold leading-tight">{box.title}</h3>
                <p className={cn("mt-2 text-[24px] leading-snug", last ? "text-primary-foreground/85" : "text-muted-foreground")}>{box.text}</p>
              </Card>
            </li>,
            !last && (
              <li key={`${box.title}-arrow`} aria-hidden="true" className="flex"><ArrowRight className="m-auto h-9 w-9 text-primary" /></li>
            ),
          ];
        })}
      </ol>
      <div aria-hidden="true" className="mx-[8%] h-20 rounded-b-[48px] border-x-4 border-b-4 border-dashed border-amber-400" />
      <p className="mt-6 text-center text-[32px] font-semibold text-amber-600">Her result improves the next patient's decision</p>
      <p className="mt-10 text-center text-[27px] text-muted-foreground">Every clinic reports in one open format, so any evidence system can combine the results.</p>
    </SlideFrame>
  );
}

const year = [
  { icon: BookOpen, when: "Week 0", title: "Explores", text: "Compares labels; video visit with her doctor." },
  { icon: FileText, when: "Week 1", title: "Consents", text: "Signs the form; a charity helps pay." },
  { icon: Stethoscope, when: "Week 2", title: "First dose", text: "At a clinic near home." },
  { icon: CalendarClock, when: "Months 1-6", title: "Tracked", text: "Memory tests and phone check-ins." },
  { icon: ClipboardCheck, when: "Month 6", title: "Recorded", text: "Coded outcome filed, good or bad." },
  { icon: Star, when: "Year 1", title: "Label updated", text: "Her result joins the evidence." },
];

export function YearSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <ol className="relative grid grid-cols-6 gap-8">
        <div aria-hidden="true" className="absolute left-[36px] right-[200px] top-[36px] h-1 rounded-full bg-gradient-to-r from-primary from-70% to-amber-400" />
        {year.map((stop, index) => (
          <li key={stop.when} className="relative">
            <IconBadge icon={stop.icon} size={72} tone={index === year.length - 1 ? "highlight" : "solid"} className="ring-8 ring-background" />
            <p className="mt-6 text-[22px] font-semibold uppercase tracking-[0.1em] text-primary">{stop.when}</p>
            <h3 className="mt-2 text-[34px] font-semibold">{stop.title}</h3>
            <p className="mt-2 text-[25px] leading-snug text-muted-foreground">{stop.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-20 flex items-center gap-8">
        <Image src="/present/margaret.png" alt="" width={120} height={120} className="rounded-full bg-primary/10" />
        <p className="text-[40px] font-medium italic leading-snug">Margaret got treatment through her own doctor, and the next patient learns from her.</p>
      </div>
    </SlideFrame>
  );
}

