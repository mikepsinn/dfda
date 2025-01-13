"use client"

import { Button } from "@/components/ui/button"
import { dfdaLinks } from "@/config/navigation/domains/dfda-nav"
export function GitHubEditButton() {
  const url = dfdaLinks.editDiseaseEradicationAct.href
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button variant="neobrutalist" className="">
        ✏️ Improve the Bill!
      </Button>
    </a>
  )
}