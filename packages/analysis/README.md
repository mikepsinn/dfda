# analysis

Deterministic calculations for time-series studies from a person's recorded
data ([evidence and exchange](../../docs/EVIDENCE-AND-EXCHANGE.md#time-series-studies-from-recorded-data)).
The web app owns storage, jobs and pages: it loads a person's measurements,
calls `analyzeRelationship` and stores the results in
`user_variable_relationships` ([`apps/web/lib/analysis`](../../apps/web/lib/analysis)).

```sh
pnpm test        # known answers and calibration
pnpm type-check
```

## Method (`personal-relationship-1`)

It starts from QuantiModo's personal correlation (`QMUserCorrelation`) and keeps
its data steps:

1. **Daily values** (`dailyValues`). A day's measurements are summed or
   averaged. For a dose, a day without a measurement counts as zero between
   the first and last recorded day. The app passes local days and the rules
   for each variable.
2. **Pairs** (`pairsInWindow`). A window has an onset delay and a duration of
   action. If missing days of the predictor count as zero, each outcome day
   is paired with the predictor's average over the window ending that many
   days earlier. Otherwise each predictor day is paired with the outcome's
   average over the window starting that many days later. Unlike QuantiModo,
   a window must lie within the days its variable was tracked.

What changed, and why:

| QuantiModo | Here | Why |
| --- | --- | --- |
| Onset delay and duration fixed per category; the delay and duration searches were only charted | 25 windows (delays 0, 1, 2, 4, 8 days × durations 1, 2, 4, 8, 16 days), at most a quarter of the predictor's tracked days back; the strongest is kept | People asked for settings to be found from the data |
| "p-value" was the normal density of a t-value, not a probability | Student's t on the trend-adjusted correlation, with the effective number of pairs | A probability that means what it says |
| Pairs treated as independent | Effective pairs: the smaller of Bartlett's and the first-order autoregressive estimate, over lags in pairs, measured before trends are removed | Runs of similar days are not independent evidence |
| No allowance for trends | Each series' straight-line trend over the paired days is removed before the p-value | Two things that changed over the same months are not related by that alone |
| No allowance for the search | The kept window's p-value is corrected for the effective number of independent windows (Šidák, with Li and Ji's count from the windows' correlations) | 25 windows give 25 chances at a small p-value; windows that share days count as fewer |
| UTC days | The person's local days | A dose at 11 pm is that day's |
| QM score, "statistical significance", optimal-value pushes | Not kept; descriptive averages kept (outcome with the predictor below and above its average, the predictor's average with the outcome above and below its average) | Heuristics, not estimates |

The raw correlation of the kept window is stored next to the trend-adjusted
one, so results stay comparable with QuantiModo's.

## Calibration

These figures come from simulations with no relationship between the
variables. A doses-and-ratings setup uses 90 days and a 20% chance of a
missing rating unless stated otherwise. The rate shown is how often the
p-value falls below 0.05, which should be at most about 5%.

| Data | False findings |
| --- | --- |
| Independent days | 4.1% |
| 30 days | 3.5% |
| Runs of similar days (autoregressive 0.8) | 1.5% |
| The same with a continuous predictor | 0.8% |
| 40 days with runs | 2.0% |
| A year with runs | 3.7% |
| 180 days with long runs (0.95) | 0.6% |
| 60% of ratings missing | 3.6% |
| A weekly predictor (like weight) | 2–5% |
| Two noisy trends with no day-to-day link | 0% (67% before trends were removed) |

These figures come from simulations with a real effect of yesterday's dose:

| Effect | 90 days | 180 days | 365 days |
| --- | --- | --- | --- |
| Correlation about 0.3 | found 43% of the time | 86% | 99% |
| Correlation about 0.55 | 99% (94% with runs) | | |

When a real effect is found, the right window is kept 75 to 99% of the time.
The calibration tests in [`test/relationship.test.ts`](test/relationship.test.ts)
repeat the first two rows on every run.

Limits: the analysis is observational and within one person. A small p-value
says the pattern is unlikely to be chance. It does not say the predictor
causes the outcome: a third thing can drive both. Effects that start more
than 8 days later or last longer than 16 days are not looked for.
