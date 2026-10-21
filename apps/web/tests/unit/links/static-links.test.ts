// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { appRoutes, routeOf } from '../../shared/app-routes'

/**
 * Every internal link in the code leads to a route of apps/web/app or a file in
 * public/: hrefs (attributes and object properties), router.push/replace and
 * redirect. A `${…}` part of a template link stands for one path segment. This
 * finds links that the browser crawler (tests/e2e/links.test.ts) cannot see,
 * such as links that only show with data the demo accounts do not have.
 */

const WEB_DIR = join(__dirname, '../../..')
const SOURCE_DIRS = ['app', 'components', 'lib', 'hooks']
const ROUTES = appRoutes()

const LINK_PATTERNS = [
  // href="/x", href='/x', href={"/x"}, href: "/x"
  /\bhref\s*[:=]\s*\{?\s*["'](\/[^"']*)["']/g,
  // href={`/x/${id}`}, href: `/x/${id}`
  /\bhref\s*[:=]\s*\{?\s*`(\/[^`]*)`/g,
  // router.push("/x"), router.replace(`/x/${id}`), redirect("/x"), permanentRedirect("/x")
  /\b(?:push|replace|redirect|permanentRedirect)\(\s*["'`](\/[^"'`]*)["'`]/g,
]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'generated' || entry.name === 'node_modules' ? [] : sourceFiles(path)
    return /\.(t|j)sx?$/.test(entry.name) ? [path] : []
  })
}

/** The path of a link: a `${…}` part stands for a segment; the query and anchor are left out. */
function pathOf(link: string): string {
  return link.replace(/\$\{[^}]*\}/g, 'x').split(/[?#]/)[0] || '/'
}

function leadsSomewhere(path: string): boolean {
  if (path.startsWith('//')) return true // another site
  return routeOf(path, ROUTES) !== null || existsSync(join(WEB_DIR, 'public', decodeURIComponent(path)))
}

describe('links in the code', () => {
  it('lead to a route of the app or a public file', () => {
    const dead: string[] = []
    let count = 0
    for (const file of SOURCE_DIRS.flatMap((dir) => sourceFiles(join(WEB_DIR, dir)))) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, index) => {
        for (const pattern of LINK_PATTERNS) {
          for (const match of line.matchAll(pattern)) {
            count++
            const path = pathOf(match[1])
            if (!leadsSomewhere(path)) dead.push(`${relative(WEB_DIR, file)}:${index + 1} → ${match[1]}`)
          }
        }
      })
    }
    expect(count).toBeGreaterThan(100)
    expect(dead).toEqual([])
  })

  it('treat a template part as one segment and ignore the query', () => {
    expect(pathOf('/conditions/${encodeURIComponent(id)}/trials?x=${y}')).toBe('/conditions/x/trials')
    expect(leadsSomewhere('/conditions/x/trials')).toBe(true)
    expect(leadsSomewhere('/conditions/x')).toBe(false)
  })
})
