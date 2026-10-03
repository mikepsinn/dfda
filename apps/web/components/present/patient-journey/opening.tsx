import Image from "next/image";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, FileText, Hospital, Lock, Sparkles, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Eyebrow, IconBadge, PatientPath, SlideFrame, journeyIcons } from "@/components/present/slide";
import type { ScriptSlide } from "@/lib/present/script";
import { cn } from "@/lib/utils";

type Props = { s: ScriptSlide };

export function TitleSlide({ s }: Props) {
  return (
    <SlideFrame s={s} tone="dark" header={false}>
      <PatientPath className="mx-auto mt-8" />
      <div className="absolute bottom-[40px] left-0 max-w-[1500px]">
        <Eyebrow dark>{s.eyebrow}</Eyebrow>
        <h2 className="mt-6 text-[96px] font-bold leading-[1.04] tracking-tight">{s.title}</h2>
        <p className="mt-8 max-w-[1350px] text-[36px] leading-snug text-muted-foreground">{s.subtitle}</p>
      </div>
    </SlideFrame>
  );
}

export function MargaretSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <div className="grid h-full grid-cols-[1.1fr_1fr] gap-12">
        <Card className="flex flex-col justify-center gap-10 p-16">
          <div className="flex items-center gap-8">
            <Image src="/present/margaret.png" alt="" width={176} height={176} className="rounded-full bg-primary/10" />
            <p className="text-[68px] font-bold tracking-tight">Margaret, 68</p>
          </div>
          <p className="text-[40px] leading-snug text-muted-foreground">
            Margaret has Alzheimer's disease. Researchers have identified{" "}
            <strong className="font-semibold text-foreground">573 existing drugs</strong> that might help her.{" "}
            <strong className="font-semibold text-foreground">Few have ever been tested</strong> for Alzheimer's.
          </p>
        </Card>
        <div className="flex flex-col gap-10">
          <Card className="flex-1 p-12">
            <div className="flex items-center gap-5">
              <IconBadge icon={Lock} size={64} />
              <Eyebrow>Today</Eyebrow>
            </div>
            <h3 className="mt-6 text-[40px] font-semibold">No evidence</h3>
            <p className="mt-3 text-[28px] leading-snug text-muted-foreground">
              No approved drug has helped her, and no trial is open near her. Her doctor has no evidence for any of the
              573, and if she takes one, nobody records what happens.
            </p>
          </Card>
          <Card className="flex-1 border-primary/30 bg-primary/10 p-12">
            <div className="flex items-center gap-5">
              <IconBadge icon={Sparkles} size={64} tone="solid" />
              <Eyebrow>With care-integrated trials</Eyebrow>
            </div>
            <h3 className="mt-6 text-[40px] font-semibold">Treatment through her own doctor</h3>
            <p className="mt-3 text-[28px] leading-snug text-muted-foreground">
              Her doctor can recommend a screened treatment at a local clinic, with her consent, and her result is published.
            </p>
          </Card>
        </div>
      </div>
    </SlideFrame>
  );
}

const millions = [
  { value: "7.4M", label: "Americans 65 and older with Alzheimer's" },
  { value: "30M", label: "Americans with a rare disease" },
  { value: "2.1M", label: "new cancer cases every year" },
  { value: "95%", label: "of rare diseases have no FDA-approved treatment" },
];

export function MillionsSlide({ s }: Props) {
  return (
    <SlideFrame s={s} tone="dark">
      <div aria-hidden="true" className="h-16 bg-[radial-gradient(circle,hsl(var(--muted-foreground)/0.35)_2px,transparent_3px)] bg-[length:36px_36px]" />
      <dl className="mt-20 grid grid-cols-4 gap-16">
        {millions.map(stat => (
          <div key={stat.value} className="border-t-4 border-amber-400 pt-10">
            <dt className="sr-only">{stat.label}</dt>
            <dd className="text-[120px] font-bold leading-none tracking-tight text-amber-400 tabular-nums">{stat.value}</dd>
            <dd className="mt-6 text-[34px] leading-snug">{stat.label}</dd>
          </div>
        ))}
      </dl>
    </SlideFrame>
  );
}

const reasons = [
  { heading: "No one pays to test old drugs", value: "573", text: "drugs proposed for Alzheimer's, mostly untested. Old drugs can't be patented, so no company pays for a trial." },
  { heading: "No one learns from patients", value: "99.8%", text: "of Alzheimer's patients are in no study. Nobody records, pools or publishes what happens to them." },
  { heading: "Right to Try wasn't built for this", value: "21", text: "drugs used under the federal law from 2018 to 2024. It covers only drugs still in testing, and the maker can say no." },
];

export function ReasonsSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <div className="grid h-full grid-cols-3 gap-10">
        {reasons.map(reason => (
          <Card key={reason.heading} className="flex flex-col p-12">
            <h3 className="text-[38px] font-semibold leading-tight">{reason.heading}</h3>
            <p className="mt-10 text-[112px] font-bold leading-none tracking-tight text-primary tabular-nums">{reason.value}</p>
            <p className="mt-8 text-[30px] leading-snug text-muted-foreground">{reason.text}</p>
          </Card>
        ))}
      </div>
    </SlideFrame>
  );
}

const recovery = [
  { value: "100 days", when: "March to June 2020", text: "to show that dexamethasone, a cheap steroid used for decades, cuts deaths among the sickest COVID patients by up to a third" },
  { value: "Hours", when: "June 16, 2020", text: "until it was in NHS treatment guidance" },
  { value: "1 million", when: "By March 2021", text: "lives saved worldwide in the next nine months (estimate)", highlight: true },
];

export function RecoverySlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <p className="text-[30px] text-muted-foreground">
        <strong className="font-semibold text-foreground">RECOVERY trial, United Kingdom, 2020:</strong> run inside ordinary NHS hospital care
      </p>
      <ol className="relative mt-16 grid grid-cols-3 gap-12">
        <div aria-hidden="true" className="absolute left-[40px] right-[40px] top-[40px] h-1 rounded-full bg-gradient-to-r from-primary via-primary to-amber-400" />
        {recovery.map(stop => (
          <li key={stop.value} className="relative">
            <span aria-hidden="true" className={cn("block h-20 w-20 rounded-full border-[10px] border-background shadow-md",
              stop.highlight ? "bg-amber-400" : "bg-primary")} />
            <p className="mt-6 text-[22px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{stop.when}</p>
            <p className={cn("mt-3 text-[92px] font-bold leading-none tracking-tight tabular-nums",
              stop.highlight ? "text-amber-500" : "text-primary")}>{stop.value}</p>
            <p className="mt-6 max-w-[500px] text-[30px] leading-snug">{stop.text}</p>
          </li>
        ))}
      </ol>
    </SlideFrame>
  );
}

export const threeChanges = [
  { icon: UserRound, lead: "Any patient", text: "can get the most promising treatments through their own doctor, after independent review and with written consent." },
  { icon: Hospital, lead: "Clinics can charge a fair price,", text: "so they have a reason to offer treatments nobody else will fund." },
  { icon: FileText, lead: "Every result is published,", text: "good or bad, so the next patient chooses better." },
];

export function IdeaSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <div className="grid h-full grid-cols-3 gap-10">
        {threeChanges.map(change => (
          <Card key={change.lead} className="p-12">
            <IconBadge icon={change.icon} size={96} tone="solid" />
            <p className="mt-10 text-[38px] leading-snug">
              <strong className="font-semibold">{change.lead}</strong>{" "}
              <span className="text-muted-foreground">{change.text}</span>
            </p>
          </Card>
        ))}
      </div>
    </SlideFrame>
  );
}

const steps = [
  { title: "Explore options", text: "Compare treatment rankings and outcome labels" },
  { title: "Talk with your doctor", text: "Get a recommendation and decide on a treatment plan" },
  { title: "Informed consent", text: "Decide in writing" },
  { title: "Arrange payment", text: "Fair prices, so clinics offer it" },
  { title: "Treatment and tracking", text: "Share good and bad outcomes" },
  { title: "Results reported", text: "De-identified, in a public registry" },
  { title: "Rankings and labels improve", text: "The next patient chooses better" },
];

function StepCard({ n }: { n: number }) {
  const step = steps[n - 1];
  const last = n === steps.length;
  return (
    <Card className={cn("h-full p-8", last && "border-primary bg-primary text-primary-foreground")}>
      <div className="flex items-center justify-between">
        <IconBadge icon={journeyIcons[n - 1]} size={64} tone={last ? "highlight" : "soft"} />
        <span className={cn("text-[34px] font-bold tabular-nums", last ? "text-primary-foreground/80" : "text-primary/60")}>{n}</span>
      </div>
      <h3 className="mt-6 text-[32px] font-semibold leading-tight">{step.title}</h3>
      <p className={cn("mt-2 text-[24px] leading-snug", last ? "text-primary-foreground/85" : "text-muted-foreground")}>{step.text}</p>
    </Card>
  );
}

const arrow = "m-auto h-10 w-10 text-primary";

export function StepsSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <ol className="sr-only">{steps.map(step => <li key={step.title}>{step.title}: {step.text}</li>)}</ol>
      <div aria-hidden="true" className="grid h-full grid-cols-[1fr_56px_1fr_56px_1fr_56px_1fr] grid-rows-[1fr_64px_1fr] items-stretch">
        <StepCard n={1} /><ArrowRight className={arrow} /><StepCard n={2} /><ArrowRight className={arrow} />
        <StepCard n={3} /><ArrowRight className={arrow} /><StepCard n={4} />
        <ArrowUp className="m-auto h-10 w-10 text-amber-500" /><span /><span /><span /><span /><span />
        <ArrowDown className={arrow} />
        <p className="self-center text-center text-[26px] font-semibold leading-snug text-amber-600">Then it starts again, with better data</p>
        <ArrowLeft className="m-auto h-10 w-10 text-amber-500" />
        <StepCard n={7} /><ArrowLeft className={arrow} /><StepCard n={6} /><ArrowLeft className={arrow} /><StepCard n={5} />
      </div>
    </SlideFrame>
  );
}
