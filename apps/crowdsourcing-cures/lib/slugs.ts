/**
 * Slug utilities matching Laravel's URL generation format
 * Based on Variable::toSlug() and VariableCategory::toSlug() in Laravel
 */

/**
 * Convert a name to a URL slug (spaces → underscores)
 * Matches Laravel: Variable::toSlug() and VariableCategory::toSlug()
 */
export function nameToSlug(name: string): string {
  let slug = name.replace(/ /g, '_')
  slug = slug.replace(/"/g, '')
  // Replace en-dash and em-dash with regular hyphen
  slug = slug.replace(/[–—]/g, '-')
  // Replace colons with hyphens
  slug = slug.replace(/:/g, '-')
  // Replace invalid filesystem characters
  slug = slug.replace(/[<>|?*]/g, '_')
  // Remove ellipsis (from truncated names)
  slug = slug.replace(/\.\.\./g, '')
  return slug
}

/**
 * Convert a URL slug back to a name (underscores → spaces)
 * Matches Laravel: Variable::fromSlug() and VariableCategory::fromSlug()
 */
export function slugToName(slug: string): string {
  return slug.replace(/_/g, ' ')
}
