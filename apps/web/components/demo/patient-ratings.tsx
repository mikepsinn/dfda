import {
  ratingLevels, type PatientRating, type PatientRatingGroup, type RatingLevel,
} from "@/lib/evidence/patient-ratings";

const visibleCount = 10;
// Decorative; the counts beside each bar carry the values.
const segmentClass: Record<RatingLevel, string> = {
  majorImprovement: "bg-primary",
  moderateImprovement: "bg-primary/45",
  noEffect: "bg-muted-foreground/25",
  worse: "bg-destructive/55",
  muchWorse: "bg-destructive",
};
const formatCount = (value: number) => value.toLocaleString("en-US");

function RatingRow({ rating, rank }: { rating: PatientRating; rank: number }) {
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 gap-y-2 px-4 py-4 sm:px-5 md:grid-cols-[2rem_minmax(0,1fr)_minmax(0,23rem)] md:items-center md:gap-x-4">
      <span className="pt-0.5 text-sm font-semibold tabular-nums text-muted-foreground">{rank}</span>
      <div className="min-w-0">
        <p className="break-words font-medium">{rating.name}</p>
        <p className="text-sm tabular-nums text-muted-foreground">
          {Math.round(rating.improvedShare * 100)}% reported improvement · {formatCount(rating.total)} {rating.total === 1 ? "rating" : "ratings"}
        </p>
      </div>
      <div className="col-start-2 min-w-0 md:col-start-3">
        <div aria-hidden="true" className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          {ratingLevels.map(({ key }) => rating.counts[key] > 0 && (
            <div key={key} className={segmentClass[key]} style={{ width: `${(rating.counts[key] / rating.total) * 100}%` }} />
          ))}
        </div>
        <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
          {ratingLevels.map(({ key, short }, index) => (
            <span key={key}>
              {index > 0 && " · "}<span className="whitespace-nowrap">{short} {formatCount(rating.counts[key])}</span>
            </span>
          ))}
        </p>
      </div>
    </li>
  );
}

function RatingGroup({ group }: { group: PatientRatingGroup }) {
  const rest = group.treatments.slice(visibleCount);
  return (
    <div className="space-y-3">
      <h3 className="flex flex-wrap items-baseline gap-x-2 text-lg font-semibold">
        Rated for {group.condition}
        <span className="whitespace-nowrap text-sm font-normal tabular-nums text-muted-foreground">
          {group.treatments.length} treatments · {formatCount(group.total)} ratings
        </span>
      </h3>
      <div className="overflow-hidden rounded-xl border bg-card">
        <ol className="divide-y">
          {group.treatments.slice(0, visibleCount).map((rating, index) => (
            <RatingRow key={rating.id} rating={rating} rank={index + 1} />
          ))}
        </ol>
        {rest.length > 0 && (
          <details className="group border-t">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-primary hover:bg-muted/50 sm:px-5">
              <span className="group-open:hidden">Show {rest.length} more treatments</span>
              <span className="hidden group-open:inline">Show fewer treatments</span>
            </summary>
            <ol className="divide-y border-t" start={visibleCount + 1}>
              {rest.map((rating, index) => (
                <RatingRow key={rating.id} rating={rating} rank={visibleCount + index + 1} />
              ))}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
}

// Aggregated patient ratings for one condition, kept separate from the estimates above them.
export function PatientRatings({ groups }: { groups: PatientRatingGroup[] }) {
  return (
    <section id="patient-ratings" aria-labelledby="patient-ratings-heading" className="scroll-mt-24 space-y-5">
      <div className="space-y-2">
        <h2 id="patient-ratings-heading" className="text-2xl font-semibold tracking-tight">Patient ratings</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Self-reported by patients. Sorted by the share of ratings that report improvement, allowing for
          how many ratings each treatment has. A share of ratings is not the chance a treatment will work for you.
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {ratingLevels.map(({ key, label }) => (
            <li key={key} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${segmentClass[key]}`} />{label}
            </li>
          ))}
        </ul>
      </div>
      {groups.map(group => <RatingGroup key={group.condition} group={group} />)}
    </section>
  );
}
