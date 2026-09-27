import { z } from "zod";

// A deliberately bounded adapter, not a parser for arbitrary registry outcomes.
export const trialSelection = {
  nctId: "NCT01097616",
  conditionSlug: "insomnia",
  treatmentSlug: "suvorexant",
  outcomeTitle:
    "Suvorexant LD Versus Placebo: Change From Baseline in sTSTm at Month 3",
  apiUrl: "https://clinicaltrials.gov/api/v2/studies/NCT01097616",
  resultsUrl: "https://clinicaltrials.gov/study/NCT01097616?tab=results",
} as const;

const numeric = z.string().regex(/^-?\d+(?:\.\d+)?$/).transform(Number)
  .pipe(z.number().finite());
const participantCount = z.string().regex(/^\d+$/).transform(Number)
  .pipe(z.number().int().positive().safe());
const text = z.string().min(1);
const groupId = z.enum(["OG000", "OG001"]);
const outcomeSchema = z.object({
  title: z.literal(trialSelection.outcomeTitle),
  type: z.literal("SECONDARY"),
  reportingStatus: z.literal("POSTED"),
  description: text,
  populationDescription: text,
  timeFrame: z.literal("Baseline and Month 3"),
  paramType: z.literal("LEAST_SQUARES_MEAN"),
  dispersionType: z.literal("95% Confidence Interval"),
  unitOfMeasure: z.literal("minutes"),
  groups: z.array(z.object({ id: groupId, title: text, description: text })).length(2),
  denoms: z.array(z.object({
    units: z.literal("Participants"),
    counts: z.array(z.object({ groupId, value: participantCount })).length(2),
  })).length(1),
  classes: z.array(z.object({
    title: z.string().optional(),
    categories: z.array(z.object({
      title: z.string().optional(),
      measurements: z.array(z.object({
        groupId, value: numeric, lowerLimit: numeric, upperLimit: numeric,
      })).length(2),
    })).length(1),
  })).length(1),
  analyses: z.array(z.object({
    groupIds: z.array(groupId).length(2),
    groupDescription: text,
    nonInferiorityType: z.literal("SUPERIORITY_OR_OTHER"),
    statisticalMethod: z.literal("Longitudinal Data Analysis"),
    statisticalComment: text,
    paramType: z.literal("Difference in Least Squares Means"),
    paramValue: numeric,
    ciPctValue: z.literal("95"),
    ciNumSides: z.literal("TWO_SIDED"),
    ciLowerLimit: numeric,
    ciUpperLimit: numeric,
  })).length(1),
});

const sourceSchema = z.object({
  nctId: z.literal(trialSelection.nctId),
  studyTitle: text,
  lastUpdatePosted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  design: z.object({
    studyType: z.literal("INTERVENTIONAL"),
    phases: z.array(z.literal("PHASE3")).length(1),
    designInfo: z.object({
      allocation: z.literal("RANDOMIZED"),
      interventionModel: z.literal("PARALLEL"),
      maskingInfo: z.object({ masking: z.literal("DOUBLE") }),
    }),
  }),
  outcome: outcomeSchema,
});

function requireValue(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Unsupported trial result: ${message}`);
}

export function extractTrialComparison(rawSource: unknown) {
  const source = sourceSchema.parse(rawSource);
  const outcome = source.outcome;
  const category = outcome.classes[0].categories[0];
  requireValue(!outcome.classes[0].title && !category.title, "subgroup/category needs review");
  const counts = outcome.denoms[0].counts;
  const measurements = category.measurements;
  const analysis = outcome.analyses[0];
  for (const ids of [outcome.groups.map(g => g.id), counts.map(c => c.groupId),
    measurements.map(m => m.groupId), analysis.groupIds]) {
    requireValue(new Set(ids).size === 2, "duplicate or missing group");
  }
  function arm(id: "OG000" | "OG001", title: string) {
    const group = outcome.groups.find(g => g.id === id)!;
    const measurement = measurements.find(m => m.groupId === id)!;
    requireValue(group.title === title, "group mapping changed");
    requireValue(measurement.lowerLimit <= measurement.value &&
      measurement.value <= measurement.upperLimit, "invalid arm interval");
    return {
      name: group.title,
      regimen: group.description.replace(/\\</g, "<"),
      participants: counts.find(c => c.groupId === id)!.value,
      adjustedChange: measurement.value,
    };
  }
  const treatment = arm("OG000", "Suvorexant LD");
  const control = arm("OG001", "Placebo");
  requireValue(analysis.ciLowerLimit <= analysis.paramValue &&
    analysis.paramValue <= analysis.ciUpperLimit, "invalid contrast interval");
  // Direction was checked against this specific record, not inferred from array
  // ordering. This guard detects incompatible revisions, allowing source rounding.
  requireValue(Math.abs(treatment.adjustedChange - control.adjustedChange -
    analysis.paramValue) <= 0.11, "contrast direction/scale needs review");
  return {
    origin: "trial-reported" as const,
    synthesis: "single-study" as const,
    ...trialSelection,
    studyTitle: source.studyTitle,
    lastUpdatePosted: source.lastUpdatePosted,
    outcomeTitle: outcome.title,
    outcomeDescription: outcome.description,
    populationDescription: outcome.populationDescription,
    endpointType: outcome.type,
    timeFrame: outcome.timeFrame,
    unit: outcome.unitOfMeasure,
    treatment,
    control,
    effect: {
      measure: analysis.paramType,
      direction: "treatment-minus-control" as const,
      value: analysis.paramValue,
      confidenceLevel: 95,
      lower: analysis.ciLowerLimit,
      upper: analysis.ciUpperLimit,
      method: analysis.statisticalMethod,
      adjustments: analysis.statisticalComment,
      testingNotes: analysis.groupDescription,
    },
  };
}

export type TrialComparison = ReturnType<typeof extractTrialComparison>;

// Preserve the selected API objects verbatim in the snapshot. Validate a parsed
// copy separately; never replace missing results with an estimate or a zero.
export function selectTrialSource(study: unknown) {
  const parsed = z.object({
    protocolSection: z.object({
      identificationModule: z.object({ nctId: text, briefTitle: text }),
      statusModule: z.object({ lastUpdatePostDateStruct: z.object({ date: text }) }),
      designModule: z.record(z.unknown()),
    }),
    resultsSection: z.object({ outcomeMeasuresModule: z.object({
      outcomeMeasures: z.array(z.object({ title: text }).passthrough()),
    }) }),
  }).parse(study);
  const matches = parsed.resultsSection.outcomeMeasuresModule.outcomeMeasures
    .filter(o => o.title === trialSelection.outcomeTitle);
  requireValue(matches.length === 1, "expected one matching endpoint");
  const source = {
    nctId: parsed.protocolSection.identificationModule.nctId,
    studyTitle: parsed.protocolSection.identificationModule.briefTitle,
    lastUpdatePosted: parsed.protocolSection.statusModule.lastUpdatePostDateStruct.date,
    design: parsed.protocolSection.designModule,
    outcome: matches[0],
  };
  extractTrialComparison(source);
  return source;
}

export const trialSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  sourceUrl: z.literal(trialSelection.apiUrl),
  retrievedAt: z.string().datetime(),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  source: z.unknown(),
}).strict();
