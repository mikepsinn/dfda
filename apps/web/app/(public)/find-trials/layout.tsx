import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Find Clinical Trials | Open Treatment Evidence Network",
  description: "Search clinical trials by condition, treatment and location.",
}

export default function FindTrialsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 