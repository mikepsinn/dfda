import { getMarkdownFiles } from "@/lib/markdown/get-markdown-files"
import type { ProcessedMarkdownFile } from "@/lib/markdown/get-markdown-files"
import type { MarkdownFile } from "@/interfaces/markdownFile"

interface Statistic extends MarkdownFile {
  emoji: string
  number: string
  textFollowingNumber: string
}

async function getMarkdownStatistics(dirPath: string): Promise<Statistic[]> {
  const files = await getMarkdownFiles(dirPath)
  
  return files.map(file => {
    const emoji = file.metadata.emoji || ""
    const hasHeaderInContent = file.content.trim().startsWith('#')
    
    // Add title with emoji if not present
    const content = hasHeaderInContent 
      ? file.content 
      : `# ${emoji} ${file.name}\n\n${file.content}`
    
    return {
      ...file,
      content,
      emoji,
      number: file.metadata.number || "",
      textFollowingNumber: file.metadata.textFollowingNumber || ""
    }
  })
}

export async function getBenefitStatistics(): Promise<Statistic[]> {
  return getMarkdownStatistics('public/docs/benefits')
}

export async function getProblemStatistics(): Promise<Statistic[]> {
  return getMarkdownStatistics('public/docs/problems/statistics')
}

export async function getProblems(): Promise<ProcessedMarkdownFile[]> {
  return getMarkdownFiles("public/docs/problems")
} 