import { notFound } from 'next/navigation'
import { resolveInstance } from '@/lib/instance/resolve'
import { findProgram } from './data'

/** The program with this slug on the company instance of the current request, or a 404 page. */
export async function requireCurrentProgram(programSlug: string) {
  const instance = await resolveInstance()
  if (!instance) notFound()
  const program = await findProgram(instance.slug, programSlug)
  if (!program) notFound()
  return { instance, program }
}
