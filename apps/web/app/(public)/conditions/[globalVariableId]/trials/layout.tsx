import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Clinical Trials | Open Treatment Evidence Network",
  description: "View clinical trials for a specific medical condition",
}

export default function ConditionTrialsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 