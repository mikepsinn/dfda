"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

import VariableSearchAutocomplete from "@/app/components/VariableSearchAutocomplete"
import { getEmbeddableVariableUrl } from "@/lib/dfda/variable-page-url"
import type { GlobalVariable } from "@/types/models/all"

const searches = [
  {
    title: "See Effects of Foods🍟",
    placeholder: "Enter Foods🍟",
    variableCategoryName: "Foods",
  },
  {
    title: "See Effects of Treatments💊",
    placeholder: "Enter treatment 💊",
    variableCategoryName: "Treatments",
  },
  {
    title: "See Most Effective Treatments for your Condition",
    placeholder: "Enter symptom 🤒",
    variableCategoryName: "Symptoms",
  },
] as const

export default function VariableStudySearchSections() {
  const [selectedVariableUrl, setSelectedVariableUrl] = useState<string | null>(
    null
  )
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const closeVariableStudy = useCallback(() => {
    setSelectedVariableUrl(null)
  }, [])

  const onVariableSelect = useCallback((variable: GlobalVariable) => {
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement) {
      const searchInput = activeElement
        .closest("[data-variable-search-autocomplete]")
        ?.querySelector<HTMLInputElement>('input[type="search"]')
      returnFocusRef.current = searchInput ?? activeElement
    }

    setSelectedVariableUrl(getEmbeddableVariableUrl(variable))
  }, [])

  useEffect(() => {
    if (!selectedVariableUrl) return

    const previousOverflow = document.body.style.overflow
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeVariableStudy()
    }
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) return

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), iframe, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([data-focus-sentinel])'
        )
      )

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (
        event.shiftKey &&
        (activeElement === firstElement ||
          !dialogRef.current.contains(activeElement))
      ) {
        event.preventDefault()
        lastElement.focus()
      } else if (
        !event.shiftKey &&
        (activeElement === lastElement ||
          !dialogRef.current.contains(activeElement))
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleEscape)
    document.addEventListener("keydown", handleTab)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("keydown", handleTab)
      returnFocusRef.current?.focus()
      returnFocusRef.current = null
    }
  }, [closeVariableStudy, selectedVariableUrl])

  return (
    <>
      {selectedVariableUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Variable mega-study"
          className="fixed inset-0 z-50 bg-black/75 p-4"
          onClick={closeVariableStudy}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="relative h-full w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close variable mega-study"
              className="absolute right-0 top-0 z-10 rounded-full bg-white p-4 text-black hover:bg-gray-100"
              onClick={closeVariableStudy}
            >
              <X aria-hidden="true" size={32} />
            </button>
            <iframe
              src={selectedVariableUrl}
              className="h-full w-full rounded-xl bg-white"
              title="Variable mega-study"
            />
            <span
              data-focus-sentinel
              tabIndex={0}
              className="sr-only"
              onFocus={() => closeButtonRef.current?.focus()}
            />
          </div>
        </div>
      )}

      {searches.map((search) => (
        <section
          key={search.variableCategoryName}
          className="neobrutalist-gradient-container neobrutalist-gradient-pink"
        >
          <h2 className="neobrutalist-title">{search.title}</h2>
          <div className="flex flex-col gap-4 md:flex-row">
            <VariableSearchAutocomplete
              onVariableSelect={onVariableSelect}
              searchParams={{
                sort: "-numberOfCorrelationsAsCause",
                isPublic: "1",
                variableCategoryName: search.variableCategoryName,
                limit: "10",
              }}
              placeholder={search.placeholder}
            />
          </div>
        </section>
      ))}
    </>
  )
}
