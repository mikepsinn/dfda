import { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import fs from 'fs'
import path from 'path'

import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: `The ${siteConfig.name} Privacy and Use Policy - Learn how we protect and handle your data.`
}

export default async function PrivacyPage() {
  const privacyMdPath = path.join(process.cwd(), 'public/docs/privacy.md')
  let content = await fs.promises.readFile(privacyMdPath, 'utf8')
  
  // Replace hardcoded dFDA references with siteConfig values
  // Replace "The dFDA" first, then standalone "dFDA" to avoid double replacement
  // Remove "The " prefix from siteConfig.name if it exists, to avoid "The The ..."
  const siteName = siteConfig.name.replace(/^The /i, '')
  content = content.replace(/The dFDA/g, siteName)
  content = content.replace(/\bdFDA\b/g, siteName)
  // Replace URLs
  const baseUrl = siteConfig.url.base.replace(/\/$/, '') // Remove trailing slash
  content = content.replace(/https:\/\/dfda\.earth/g, baseUrl)
  content = content.replace(/https:\/\/trust\.dfda\.earth/g, `${baseUrl}/trust`)
  // Replace email addresses
  const hostname = new URL(siteConfig.url.base).hostname
  content = content.replace(/support@dfda\.earth/g, `support@${hostname}`)

  return (
    <article className="prose prose-slate max-w-4xl mx-auto px-4 py-8 lg:py-12">
      <MDXRemote source={content} />
    </article>
  )
}
