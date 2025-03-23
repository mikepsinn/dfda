import type React from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

interface DocLinkProps {
  href: string
  children: React.ReactNode
  external?: boolean
}

export function DocLink({ href, children, external = false }: DocLinkProps) {
  return (
    <Link
      href={href}
      className="text-primary hover:underline inline-flex items-center"
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {children}
      {external && <ExternalLink className="ml-1 h-3 w-3" />}
    </Link>
  )
}

