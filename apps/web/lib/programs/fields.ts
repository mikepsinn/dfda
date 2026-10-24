import type { ValueField } from '@/components/programs/ProgramValuesForm'
import { SCALE_RANGES, scaleWords } from './config'
import type { ProgramItem } from './data'

/** The form field of a program item: rating buttons for a rating scale, the usual amount of a dose. */
export function valueField(item: ProgramItem): ValueField {
  const range = SCALE_RANGES[item.unitId]
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    kind: item.kind,
    usual: item.kind === 'dose' ? item.defaultValue : null,
    scale: range && item.kind !== 'dose' ? { min: range[0], max: range[1], words: scaleWords(item.better, range[0]) } : null,
  }
}
