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
        {/* The initiative's name: second only to the headline. */}
        <Eyebrow dark className="text-[44px] font-bold tracking-[0.06em]">{s.eyebrow}</Eyebrow>
        <h2 className="mt-8 text-[96px] font-bold leading-[1.04] tracking-tight">{s.title}</h2>
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
          <Card className="flex-1 px-12 py-9">
            <div className="flex items-center gap-5">
              <IconBadge icon={Lock} size={64} />
              <Eyebrow>Today</Eyebrow>
            </div>
            <h3 className="mt-6 text-[40px] font-semibold">No evidence</h3>
            <p className="mt-3 text-[30px] leading-snug text-muted-foreground">
              No approved drug has helped her, and no trial is open near her. Her doctor has no evidence for any of the
              573, and if she takes one, nobody records what happens.
            </p>
          </Card>
          <Card className="flex-1 border-primary/30 bg-primary/10 px-12 py-9">
            <div className="flex items-center gap-5">
              <IconBadge icon={Sparkles} size={64} tone="solid" />
              <Eyebrow>With care-integrated trials</Eyebrow>
            </div>
            <h3 className="mt-6 text-[40px] font-semibold">Treatment through her own doctor</h3>
            <p className="mt-3 text-[30px] leading-snug text-muted-foreground">
              Her doctor can recommend a screened treatment at a local clinic, and her result helps the next patient.
            </p>
          </Card>
        </div>
      </div>
    </SlideFrame>
  );
}

const millions = [
  { value: "7.4M", label: "Americans with Alzheimer's" },
  { value: "30M", label: "Americans with a rare disease" },
  { value: "2.1M", label: "Americans diagnosed with cancer each year" },
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
            <dd className="text-[140px] font-bold leading-none tracking-tight text-amber-400 tabular-nums">{stat.value}</dd>
            <dd className="mt-8 text-[42px] leading-snug">{stat.label}</dd>
          </div>
        ))}
      </dl>
    </SlideFrame>
  );
}

const reasons = [
  { heading: "No one pays to test old drugs", value: "573", text: "drugs proposed for Alzheimer's are mostly untested, because no company can profit from testing a drug it can't patent." },
  { heading: "No one learns from patients", value: "99.8%", text: "of Alzheimer's patients are in no study, so nothing is learned from their treatment." },
  { heading: "Right to Try gives makers no incentive", value: "21", text: "drugs made available to patients in over six years, because the federal law lets drug makers charge only their costs." },
];

export function ReasonsSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <div className="grid h-full grid-cols-3 gap-10">
        {reasons.map(reason => (
          <Card key={reason.heading} className="flex flex-col p-12">
            <h3 className="text-[44px] font-semibold leading-tight">{reason.heading}</h3>
            <p className="mt-10 text-[136px] font-bold leading-none tracking-tight text-primary tabular-nums">{reason.value}</p>
            <p className="mt-8 text-[38px] leading-snug text-muted-foreground">{reason.text}</p>
          </Card>
        ))}
      </div>
    </SlideFrame>
  );
}

const recovery = [
  { value: "89 days", text: "to show that a cheap steroid cuts deaths among the sickest COVID patients by up to a third. Typical trials take years." },
  { value: "4", text: "treatments found that save lives, out of more than a dozen tested side by side." },
  { value: "$500", text: "per patient, 82 times less than the $41,000 of a typical trial.", highlight: true },
];

export function RecoverySlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <div className="flex h-full flex-col">
        <p className="text-[34px] leading-snug text-muted-foreground">
          <strong className="font-semibold text-foreground">How RECOVERY worked:</strong> any NHS hospital could enroll patients during their
          normal care, with little extra paperwork, and outcomes came from routine health records.
        </p>
        <div className="mt-12 grid flex-1 grid-cols-3 gap-10">
          {recovery.map(stat => (
            <Card key={stat.value} className="flex flex-col p-12">
              <p className={cn("text-[112px] font-bold leading-none tracking-tight tabular-nums",
                stat.highlight ? "text-amber-500" : "text-primary")}>{stat.value}</p>
              <p className="mt-8 text-[38px] leading-snug">{stat.text}</p>
            </Card>
          ))}
        </div>
      </div>
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
  { title: "Consent and cost", text: "Decide in writing, knowing the price" },
  { title: "Treatment and tracking", text: "Share good and bad outcomes" },
  { title: "Results reported", text: "De-identified, in a public registry" },
  { title: "Rankings and labels improve", text: "The next patient chooses better" },
];

function StepCard({ n }: { n: number }) {
  const step = steps[n - 1];
  const last = n === steps.length;
  return (
    <Card className={cn("h-full p-10", last && "border-primary bg-primary text-primary-foreground")}>
      <div className="flex items-center justify-between">
        <IconBadge icon={journeyIcons[n - 1]} size={72} tone={last ? "highlight" : "soft"} />
        <span className={cn("text-[40px] font-bold tabular-nums", last ? "text-primary-foreground/80" : "text-primary/60")}>{n}</span>
      </div>
      <h3 className="mt-6 text-[40px] font-semibold leading-tight">{step.title}</h3>
      <p className={cn("mt-3 text-[30px] leading-snug", last ? "text-primary-foreground/85" : "text-muted-foreground")}>{step.text}</p>
    </Card>
  );
}

const arrow = "m-auto h-10 w-10 text-primary";

export function StepsSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <ol className="sr-only">{steps.map(step => <li key={step.title}>{step.title}: {step.text}</li>)}</ol>
      {/* Three steps across the top, down, three back along the bottom, and up to the start again. */}
      <div aria-hidden="true" className="grid h-full grid-cols-[1fr_64px_1fr_64px_1fr] grid-rows-[1fr_72px_1fr] items-stretch">
        <StepCard n={1} /><ArrowRight className={arrow} /><StepCard n={2} /><ArrowRight className={arrow} /><StepCard n={3} />
        <ArrowUp className="m-auto h-10 w-10 text-amber-500" />
        <p className="col-span-3 self-center text-[30px] font-semibold leading-snug text-amber-600">Then it starts again, with better data</p>
        <ArrowDown className={arrow} />
        <StepCard n={6} /><ArrowLeft className={arrow} /><StepCard n={5} /><ArrowLeft className={arrow} /><StepCard n={4} />
      </div>
    </SlideFrame>
  );
}
