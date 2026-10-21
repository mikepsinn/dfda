// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The LOINC codes of the lab-test variables are set twice: by migrations for
// existing databases, and by a seed file for new ones (the seeds run after the
// migrations). Both must give the same codes, and every code must be well formed.

const db = join(__dirname, '../../../db')
const read = (file: string) => readFileSync(join(db, file), 'utf8')

/** The (variable id, LOINC code) pairs of a file's VALUES list. */
function pairs(sql: string): [string, string][] {
  return [...sql.matchAll(/\('([a-z0-9-]+)', '(\d{1,7}-\d)'\)/g)].map((match) => [match[1], match[2]])
}

/** LOINC's check digit: the mod 10 rule (Luhn) over the digits before the hyphen. */
function checkDigit(number: string): number {
  const sum = [...number]
    .reverse()
    .map(Number)
    .reduce((total, digit, index) => {
      if (index % 2 === 1) return total + digit
      const doubled = digit * 2
      return total + (doubled > 9 ? doubled - 9 : doubled)
    }, 0)
  return (10 - (sum % 10)) % 10
}

const byId = (a: [string, string], b: [string, string]) => a[0].localeCompare(b[0])
// Every migration that sets codes, as 20261021030000_alter_global_variables_loinc_codes.sql does.
const migration = readdirSync(join(db, 'migrations'))
  .map((file) => read(`migrations/${file}`))
  .filter((sql) => sql.includes('SET loinc_code = codes.loinc_code'))
  .flatMap(pairs)
  .sort(byId)
const seed = pairs(read('seeds/99_global_variable_loinc_codes.sql')).sort(byId)

describe('LOINC codes of the lab-test variables', () => {
  it('are the same in the migrations and the seed file', () => {
    expect(migration.length).toBeGreaterThan(15)
    expect(seed).toEqual(migration)
  })

  it('give each variable one code, and each code to one variable', () => {
    expect(new Set(migration.map(([id]) => id)).size).toBe(migration.length)
    expect(new Set(migration.map(([, code]) => code)).size).toBe(migration.length)
  })

  it('have a correct check digit', () => {
    expect(checkDigit('4548')).toBe(4) // HbA1c, 4548-4
    expect(checkDigit('2160')).toBe(0) // creatinine, 2160-0
    for (const [id, code] of migration) {
      const [number, digit] = code.split('-')
      expect(checkDigit(number), `${id}: ${code}`).toBe(Number(digit))
    }
  })
})
