import type { ValueField } from '@/components/programs/ProgramValuesForm'
import { SCALE_RANGES, scaleWords } from './config'
import type { ProgramItem } from './data'
import type { UnitChoice } from './units'

/**
 * The form field of a program item: rating buttons for a rating scale, the
 * usual amount of a dose, and the units of a number with the one the person
 * chose last selected (lib/programs/units.ts).
 */
export function valueField(item: ProgramItem, units?: UnitChoice[], preferred?: UnitChoice): ValueField {
  const range = SCALE_RANGES[item.unitId]
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    kind: item.kind,
    usual: item.kind === 'dose' ? item.defaultValue : null,
    scale: range && item.kind !== 'dose' ? { min: range[0], max: range[1], words: scaleWords(item.better, range[0]) } : null,
    ...(units && { units, unitId: preferred?.id ?? item.unitId }),
  }
}

/** The form fields of items, with their units and the units that the person chose. */
export function valueFields(
  items: ProgramItem[],
  choices: Map<string, UnitChoice[]>,
  preferred: Map<string, UnitChoice>,
): ValueField[] {
  return items.map((item) => valueField(item, choices.get(item.id), preferred.get(item.id)))
}
