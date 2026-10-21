// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { loincCheckDigit, migrationCodes, seedCodes } from '../../shared/variable-codes'

// The standard codes of the catalog's variables are set twice: by migrations
// for existing databases, and by the last seed file for new ones (the seeds run
// after the migrations). Both must give the same codes, and every code must be
// well formed. tests/db/catalog-tables.test.ts checks that a new database has them.

const LOINC = 'http://loinc.org'
const codes = migrationCodes()

describe('standard codes of the variables', () => {
  it('are the same in the migrations and the seed file', () => {
    expect(codes.length).toBeGreaterThan(30)
    expect(seedCodes()).toEqual(codes)
  })

  it('map each code to one variable, with its name in the code system', () => {
    expect(new Set(codes.map(({ system, code }) => `${system} ${code}`)).size).toBe(codes.length)
    for (const { code, display } of codes) expect(display, code).not.toBe('')
  })

  it('give a variable several LOINC codes when labs report it by different methods', () => {
    const ldl = codes.filter(({ variableId }) => variableId === 'ldl-cholesterol').map(({ code }) => code)
    expect(ldl.sort()).toEqual(['13457-7', '18262-6', '2089-1'])
  })

  it('have a correct LOINC check digit', () => {
    expect(loincCheckDigit('4548')).toBe(4) // HbA1c, 4548-4
    expect(loincCheckDigit('2160')).toBe(0) // creatinine, 2160-0
    for (const { variableId, system, code } of codes) {
      expect(system).toBe(LOINC)
      const [number, digit] = code.split('-')
      expect(loincCheckDigit(number), `${variableId}: ${code}`).toBe(Number(digit))
    }
  })
})
