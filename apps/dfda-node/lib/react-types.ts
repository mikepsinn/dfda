import React from 'react'

export type FormEvent = React.FormEvent<HTMLFormElement>
export type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
export type MouseEvent = React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>
export type TextAreaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>
export type FocusEvent = React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>

export type GenericFormSubmitHandler = (e: FormEvent) => void
export type GenericChangeHandler = (e: ChangeEvent) => void
export type GenericMouseEventHandler = (e: MouseEvent) => void
export type GenericKeyboardEventHandler = (e: React.KeyboardEvent) => void

// Useful for Next.js pages with params
export interface PageParams {
  params: {
    [key: string]: string
  }
} 