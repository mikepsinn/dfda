import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StudyCard from '../../components/StudyCard'
import { getStudy, getStudyBySlug } from '../../dfdaActions'
import { Study } from '@/types/models/Study'

interface StudyPageProps {
  params: {
    studyId: string
  }
}

// Parse slug format: cause-1267-effect-1398-population-study
function parseStudySlug(slug: string): { causeId: number; effectId: number } | null {
  const match = slug.match(/^cause-(\d+)-effect-(\d+)-population-study$/)
  if (!match) return null
  return {
    causeId: parseInt(match[1], 10),
    effectId: parseInt(match[2], 10),
  }
}

async function fetchStudy(studyIdOrSlug: string): Promise<Study> {
  // Check if it's a slug format
  const parsedSlug = parseStudySlug(studyIdOrSlug)

  if (parsedSlug) {
    // Fetch by cause and effect IDs
    return await getStudyBySlug(parsedSlug.causeId, parsedSlug.effectId)
  }

  // Otherwise, treat as numeric ID
  return await getStudy(studyIdOrSlug)
}

export async function generateMetadata({ params }: StudyPageProps): Promise<Metadata> {
  try {
    const study = await fetchStudy(params.studyId)

    return {
      title: study.studyText?.studyTitle || `${study.causeVariableName} → ${study.effectVariableName} Study`,
      description: study.studyText?.studyBackground || 'Analyze the relationship between variables in this study.',
    }
  } catch (error) {
    return {
      title: 'Study Not Found',
      description: 'The requested study could not be found.',
    }
  }
}

export default async function StudyPage({ params }: StudyPageProps) {
  let study: Study

  try {
    study = await fetchStudy(params.studyId)
  } catch (error) {
    notFound()
  }

  return (
    <div className="">
      <StudyCard study={study} />
    </div>
  )
}
