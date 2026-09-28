import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Find Clinical Trials | dFDA",
  description: "Search for clinical trials by medical condition",
}

export default function FindTrialsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 