export function decodeRouteParam(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch (error) {
    if (error instanceof URIError) return null
    throw error
  }
}
