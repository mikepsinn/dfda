"use client"

import { useEffect, useState } from "react"

export const CHAPTERS = [
  { id: "baseline", label: "Baseline" },
  { id: "track", label: "Track" },
  { id: "follow-up", label: "Follow-up" },
  { id: "decide", label: "Decide" },
] as const

/**
 * The chapters of the case page, under the site header: a link to each, and
 * the chapter on the screen lit. Without JavaScript the links still work.
 */
export function ChapterBar() {
  const [current, setCurrent] = useState<string>(CHAPTERS[0].id)

  useEffect(() => {
    const sections = CHAPTERS.flatMap((chapter) => document.getElementById(chapter.id) ?? [])
    // The chapter in the band at a third of the screen's height is the current one.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length) setCurrent(visible[0].target.id)
      },
      { rootMargin: "-30% 0px -65% 0px" },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <nav aria-label="Chapters" className="sticky top-16 z-40 -mx-4 border-b bg-background/95 px-4 backdrop-blur print:hidden">
      <ol className="flex justify-center gap-5 py-3 sm:gap-10">
        {CHAPTERS.map((chapter) => {
          const lit = chapter.id === current
          return (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                aria-current={lit ? "step" : undefined}
                className={`flex flex-col items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  lit ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {chapter.label}
                <span aria-hidden="true" className={`h-1 w-1 rounded-full ${lit ? "bg-primary" : "bg-transparent"}`} />
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
