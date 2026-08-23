import { nameToSlug } from "@/lib/slugs"

const STUDIES_ORIGIN = "https://studies.dfda.earth"
const VARIABLE_PATH_PREFIX = "/variables/"

interface VariablePageLink {
  name: string
  url?: string
}

function encodeVariableSlug(slug: string): string {
  return slug.split("/").map(encodeURIComponent).join("/")
}

/**
 * Builds the embeddable mega-study URL while preserving the canonical variable
 * path supplied by the API. The API's app.dfda.earth pages cannot be embedded,
 * so only their path is reused on the embeddable studies.dfda.earth origin.
 */
export function getEmbeddableVariableUrl(variable: VariablePageLink): string {
  if (variable.url) {
    try {
      const canonicalUrl = new URL(variable.url)

      if (
        canonicalUrl.pathname.startsWith(VARIABLE_PATH_PREFIX) &&
        canonicalUrl.pathname.length > VARIABLE_PATH_PREFIX.length
      ) {
        return new URL(canonicalUrl.pathname, STUDIES_ORIGIN).toString()
      }
    } catch {
      // Fall back to the Laravel-compatible variable name slug below.
    }
  }

  const slug = encodeVariableSlug(nameToSlug(variable.name))
  return new URL(`${VARIABLE_PATH_PREFIX}${slug}`, STUDIES_ORIGIN).toString()
}
