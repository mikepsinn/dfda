import { readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

/**
 * The routes of apps/web/app: each page.tsx and route.ts, without route groups
 * and parallel-route slots. Used by the link checks (tests/e2e/links.test.ts and
 * tests/unit/links/static-links.test.ts).
 */

export type AppRoute = { pattern: RegExp; dynamic: number; name: string }

export const APP_DIR = join(__dirname, '../../app')

export function appRoutes(appDir = APP_DIR): AppRoute[] {
  const routes: AppRoute[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name))
      else if (/^(page|route)\.(t|j)sx?$/.test(entry.name)) {
        const segments = relative(appDir, dir)
          .split(sep)
          .filter((segment) => segment && !/^\(.*\)$/.test(segment) && !segment.startsWith('@'))
        const source = segments
          .map((segment) => {
            if (segment.startsWith('[[...')) return '(?:/.*)?'
            if (segment.startsWith('[...')) return '/.+'
            if (segment.startsWith('[')) return '/[^/]+'
            return `/${segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
          })
          .join('')
        routes.push({
          pattern: new RegExp(`^${source}/?$`),
          dynamic: segments.filter((segment) => segment.startsWith('[')).length,
          name: `/${segments.join('/')}`,
        })
      }
    }
  }
  walk(appDir)
  return routes
}

/** The route that serves a path, or null; a static route wins over a dynamic one, as in Next.js. */
export function routeOf(pathname: string, routes: AppRoute[]): string | null {
  const matches = routes.filter((route) => route.pattern.test(pathname)).sort((a, b) => a.dynamic - b.dynamic)
  return matches[0]?.name ?? null
}
