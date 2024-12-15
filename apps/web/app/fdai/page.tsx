import { FdaiTalkingFace } from './components/FdaiTalkingFace'
import { FdaiChat } from '@/app/fdai/components/FdaiChat'

export default function FdaiPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">FDAI Assistant</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FdaiTalkingFace />
        <FdaiChat />
      </div>
    </div>
  )
} 