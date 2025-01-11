import { authOptions } from '@/lib/auth'
import { ResearchPageContent } from './components/ResearchPageContent'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'

export default async function ResearcherPage() {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if(!userId) {
        return redirect('/signin?callbackUrl=/researcher')
    }
    
    return <ResearchPageContent />
}