import type { ReactNode } from "react";
import type { DeckSlide } from "@/components/present/deck";
import {
  IdeaSlide, MargaretSlide, MillionsSlide, ReasonsSlide, RecoverySlide, StepsSlide, TitleSlide,
} from "@/components/present/patient-journey/opening";
import {
  ConsentSlide, DoctorSlide, ExploreSlide, LabelSlide, PaymentSlide, PipelineSlide, ResultsSlide, ReviewSlide,
  SafetySlide, TrackingSlide, YearSlide,
} from "@/components/present/patient-journey/journey";
import {
  ActSlide, CloseSlide, FrontierSlide, PossibleSlide, ValueSlide,
} from "@/components/present/patient-journey/closing";
import type { DemoCondition } from "@/lib/demo/treatment-estimates";
import type { ScriptSlide } from "@/lib/present/script";

// Each slide in content/patient-journey/script.md, by its number, and the component that draws it.
export function patientJourneySlides(script: ScriptSlide[], alzheimers: DemoCondition): DeckSlide[] {
  const lecanemab = alzheimers.treatments.find(t => t.slug === "lecanemab");
  if (!lecanemab) throw new Error("The Alzheimer's dataset has no Lecanemab record");
  const components: Record<string, (s: ScriptSlide) => ReactNode> = {
    "1": s => <TitleSlide s={s} />,
    "2": s => <MargaretSlide s={s} />,
    "3": s => <MillionsSlide s={s} />,
    "4": s => <ReasonsSlide s={s} />,
    "5": s => <RecoverySlide s={s} />,
    "6": s => <IdeaSlide s={s} />,
    "7": s => <StepsSlide s={s} />,
    "8": s => <ExploreSlide s={s} condition={alzheimers} />,
    "9": s => <LabelSlide s={s} treatment={lecanemab} />,
    "10": s => <ReviewSlide s={s} />,
    "11": s => <DoctorSlide s={s} />,
    "12": s => <ConsentSlide s={s} />,
    "13": s => <PaymentSlide s={s} />,
    "14": s => <TrackingSlide s={s} />,
    "15": s => <SafetySlide s={s} />,
    "16": s => <ResultsSlide s={s} />,
    "17": s => <PipelineSlide s={s} />,
    "18": s => <YearSlide s={s} />,
    "19": s => <ActSlide s={s} />,
    "20": s => <CloseSlide s={s} />,
    "B1": s => <FrontierSlide s={s} />,
    "B2": s => <PossibleSlide s={s} />,
    "B3": s => <ValueSlide s={s} />,
  };
  const missing = [
    ...script.filter(s => !components[s.key]).map(s => `slide ${s.key} has no component`),
    ...Object.keys(components).filter(key => !script.some(s => s.key === key)).map(key => `component ${key} has no slide in the script`),
  ];
  if (missing.length) throw new Error(`The patient journey script and slides disagree: ${missing.join("; ")}`);
  return script.map(s => ({
    key: s.key,
    label: s.title ?? s.heading,
    purpose: s.purpose,
    notes: s.notes,
    content: components[s.key](s),
  }));
}
