export type QuestionOption = {
  min?: number
  max?: number
  step?: number
  minLabel?: string
  maxLabel?: string
  multiline?: boolean
  placeholder?: string
  choices?: Array<{ value: string; label: string }>
  allowMultiple?: boolean
}

export type Question = {
  id: number
  type: 'text' | 'multiple-choice' | 'scale'
  question: string
  description: string
  required: boolean
  options: QuestionOption
}

export type FormSettings = {
  collectPatientIdentifiers: boolean
  timestampResponses: boolean
  allowPartialCompletion: boolean
  showProgressBar: boolean
} 