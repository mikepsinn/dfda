import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The standard codes of the catalog's variables, as the SQL files set them:
 * the migrations for an existing database, and the last seed file for a new
 * one (see db/migrations/20261021030000_table_global_variable_codes.sql).
 */
export type VariableCode = { variableId: string; system: string; code: string; display: string }

const db = join(__dirname, '../../db')
const text = "'((?:[^']|'')*)'"
const row = new RegExp(`\\(${text}, ${text}, ${text}, ${text}\\)`, 'g')
const unquote = (value: string) => value.replace(/''/g, "'")
const byCode = (a: VariableCode, b: VariableCode) => `${a.system} ${a.code}`.localeCompare(`${b.system} ${b.code}`)

function codesIn(sql: string): VariableCode[] {
  return [...sql.matchAll(row)].map(([, variableId, system, code, display]) => ({
    variableId: unquote(variableId),
    system: unquote(system),
    code: unquote(code),
    display: unquote(display),
  }))
}

/** The codes that the migrations add. */
export function migrationCodes(): VariableCode[] {
  const dir = join(db, 'migrations')
  return readdirSync(dir)
    .map((file) => readFileSync(join(dir, file), 'utf8'))
    .filter((sql) => sql.includes('INSERT INTO public.global_variable_codes'))
    .flatMap(codesIn)
    .sort(byCode)
}

/** The codes that the last seed file adds. */
export function seedCodes(): VariableCode[] {
  return codesIn(readFileSync(join(db, 'seeds/99_global_variable_codes.sql'), 'utf8')).sort(byCode)
}

/** LOINC's check digit: the mod 10 rule (Luhn) over the digits before the hyphen. */
export function loincCheckDigit(number: string): number {
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
