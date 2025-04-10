import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Clinical Trials | FDA v2",
  description: "View clinical trials for a specific medical condition",
}

export default function ConditionTrialsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 