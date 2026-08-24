import { Metadata } from "next"
import { redirect } from "next/navigation"
import fs from "fs/promises"
import path from "path"

import MarkdownFileRenderer from "@/components/markdown/MarkdownFileRenderer"

export const metadata: Metadata = {
  title: "Docs",
  description: "Info about the Decentralized FDA",
}

interface DocsProps {
  params: { filename: string }
}

export default async function Docs({ params }: DocsProps) {
  let { filename } = params
  console.log("Initial params:", params)

  // implode filename to string if it's an array
  if (Array.isArray(filename)) {
    console.log("Filename is array:", filename)
    filename = filename.join("/")
  }

  // remove trailing .md if it exists
  if (filename.endsWith(".md")) {
    filename = filename.slice(0, -3)
  }

  // Update the path to point to the correct directory
  const mdPath = `/docs/${filename}.md`
  console.log("Final markdown path:", mdPath)

  // Check if file exists
  try {
    const filePath = path.join(process.cwd(), "public", mdPath)
    await fs.access(filePath)
  } catch (error) {
    console.error("File not found:", mdPath)
    redirect("/docs") // Explicitly redirect to /docs
  }

  return <MarkdownFileRenderer url={mdPath} variant="neobrutalist" />
}
