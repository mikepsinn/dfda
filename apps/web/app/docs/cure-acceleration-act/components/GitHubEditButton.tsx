"use client"

import { Button } from "@/components/ui/button"

export function GitHubEditButton() {
  return (
    <a
      href="https://github.com/decentralized-fda/decentralized-fda/edit/main/public/docs/cure-acceleration-act.md"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button variant="neobrutalist" className="">
        ✏️ Improve the Bill!
      </Button>
    </a>
  )
}