const dollars = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0,
});

export function formatEstimatedCost(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "Not available" : dollars.format(value);
}
