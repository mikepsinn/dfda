import type { Metadata } from "next";
import { Deck } from "@/components/present/deck";
import { patientJourneySlides } from "@/components/present/patient-journey/slides";
import { getConditionEstimate } from "@/lib/demo/treatment-estimates";
import { loadScript } from "@/lib/present/script";

const title = "Care-Integrated Clinical Trials: The Patient Journey";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title,
  description: "How one patient gets a promising treatment through her own doctor, and how every result helps the next patient.",
  // A working draft (see content/patient-journey/script.md); share the link directly for now.
  robots: { index: false, follow: false },
};

// Arrow keys or space move between slides, N shows speaker notes, F goes full screen,
// and printing saves a PDF with one page per slide.
export default async function PatientJourneyPresentation() {
  const alzheimers = await getConditionEstimate("alzheimers-disease");
  if (!alzheimers) throw new Error("The Alzheimer's dataset is missing");
  return <Deck title={title} slides={patientJourneySlides(loadScript("patient-journey"), alzheimers)} />;
}
