import type { ReactNode } from "react"

interface DocContentSectionProps {
  id: string
  title: string
  children: ReactNode
}

export function DocContentSection({ id, title, children }: DocContentSectionProps) {
  return (
    <section id={id} className="mb-10">
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  )
}

