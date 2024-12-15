import path from "path"
import { Shell } from "@/components/layout/shell"
import { getDocumentationFiles } from "./actions"
import { DocsSearch } from "./components/docs-search"
import type { MarkdownFile } from "@/lib/markdown/repo-markdown"
import Link from "next/link"

// Helper function to extract title from markdown content
function extractTitle(file: MarkdownFile): string {
  if (!file.content) return getTitleFromPath(file.relativePath)
  
  // Try to get title from first # heading
  const headingMatch = file.content.match(/^#\s+(.+)$/m)
  if (headingMatch) return headingMatch[1]
  
  // Try to get title from frontmatter
  const frontmatterMatch = file.content.match(/^---\s*\ntitle:\s*(.+)\s*\n/m)
  if (frontmatterMatch) return frontmatterMatch[1]
  
  // Fallback to filename
  return getTitleFromPath(file.relativePath)
}

// Helper function to get title from file path
function getTitleFromPath(filePath: string): string {
  return path
    .basename(filePath, '.md')
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default async function MarkdownPageListPage() {
  const result = await getDocumentationFiles()
  
  if ('error' in result) {
    return (
      <Shell>
        <div className="mx-auto max-w-4xl py-8">
          <h1 className="mb-8 text-3xl font-bold">Documentation</h1>
          <p className="text-red-500">{result.error}</p>
        </div>
      </Shell>
    )
  }

  if (!result.files || result.files.length === 0) {
    return (
      <Shell>
        <div className="mx-auto max-w-4xl py-8">
          <h1 className="mb-8 text-3xl font-bold">Documentation</h1>
          <p>No documentation files found.</p>
        </div>
      </Shell>
    )
  }

  const filesWithTitles = result.files.map(file => ({
    ...file,
    title: extractTitle(file)
  }))

  return (
    <Shell>
      <div className="mx-auto max-w-4xl py-8">
        <h1 className="mb-8 text-3xl font-bold">Documentation</h1>
        
        {/* Featured Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Link href="/health-savings-sharing">
            <div className="cursor-pointer rounded-lg border-4 border-black bg-green-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">
              <h3 className="mb-2 text-xl font-bold">💰 Health Savings Sharing</h3>
              <p className="font-bold text-gray-800">
                Learn how the 50/50 Health Savings Sharing Program incentivizes cures and reduces healthcare costs
              </p>
            </div>
          </Link>

          <Link href="/cure-acceleration-act">
            <div className="cursor-pointer rounded-lg border-4 border-black bg-purple-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">
              <h3 className="mb-2 text-xl font-bold">⚡ Cure Acceleration Act</h3>
              <p className="font-bold text-gray-800">
                Explore the comprehensive plan for faster cures, lower costs, and universal access
              </p>
            </div>
          </Link>

          <a href="https://docs.dfda.earth" target="_blank" rel="noopener noreferrer">
            <div className="cursor-pointer rounded-lg border-4 border-black bg-blue-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">
              <h3 className="mb-2 text-xl font-bold">📚 API Documentation</h3>
              <p className="font-bold text-gray-800">
                Comprehensive API documentation for developers building on the DFDA platform
              </p>
            </div>
          </a>

          <a href="https://builder.dfda.earth" target="_blank" rel="noopener noreferrer">
            <div className="cursor-pointer rounded-lg border-4 border-black bg-yellow-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">
              <h3 className="mb-2 text-xl font-bold">🔨 No Code App Builder</h3>
              <p className="font-bold text-gray-800">
                Build custom healthcare applications without writing code using our visual builder
              </p>
            </div>
          </a>
        </div>

        <DocsSearch files={filesWithTitles} />
      </div>
    </Shell>
  )
}