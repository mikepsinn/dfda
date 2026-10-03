"use client"

import { useState } from "react"

// A study summary clamped to three lines, with a button to show all of it
// (the summary toggle from crowdsourcing-cures' trial list).
export function ExpandableSummary({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > 240

  return (
    <div>
      <p className={`whitespace-pre-line text-sm text-muted-foreground ${isLong && !expanded ? "line-clamp-3" : ""}`}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}
          className="mt-1 text-sm font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}
