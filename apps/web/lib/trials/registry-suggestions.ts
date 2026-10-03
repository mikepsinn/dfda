// Name suggestions from ClinicalTrials.gov's own search box, called from the browser (the endpoint
// allows any origin). It is not part of the documented API, so any failure gives no suggestions.

export type RegistrySuggestionDictionary = "Condition" | "InterventionName"

export const MIN_SUGGESTION_INPUT = 2
const MAX_SUGGESTIONS = 8

export async function fetchRegistrySuggestions(
  dictionary: RegistrySuggestionDictionary,
  input: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const text = input.trim()
  // An empty input returns example queries, not names.
  if (text.length < MIN_SUGGESTION_INPUT) return []

  const url = new URL("https://clinicaltrials.gov/api/int/suggest")
  url.searchParams.set("input", text)
  url.searchParams.set("dictionary", dictionary)
  try {
    const response = await fetch(url, { signal })
    if (!response.ok) return []
    const data: unknown = await response.json()
    if (!Array.isArray(data)) return []
    // The suggestions escape query syntax, as in "Asthma \(Diagnosis\)"; the form wants plain names.
    const names = data
      .filter((item): item is string => typeof item === "string")
      .map(item => item.replace(/\\(.)/g, "$1").trim())
      .filter(Boolean)
    return [...new Set(names)].slice(0, MAX_SUGGESTIONS)
  } catch {
    return []
  }
}
