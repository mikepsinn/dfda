import { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import fs from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'Privacy Policy | dFDA',
  description: 'The dFDA Privacy and Use Policy - Learn how we protect and handle your data.'
}

export default async function PrivacyPage() {
  const privacyMdPath = path.join(process.cwd(), 'public/docs/privacy.md')
  const content = await fs.promises.readFile(privacyMdPath, 'utf8')

  return (
    <article className="prose prose-slate max-w-4xl mx-auto px-4 py-8 lg:py-12">
      <MDXRemote source={content} />
    </article>
  )
}
