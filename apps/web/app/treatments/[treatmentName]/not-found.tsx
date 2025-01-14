import Link from 'next/link'

export default function TreatmentNotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">404: Treatment Not Found</h1>
        <p className="text-gray-600 mb-6">
          This treatment could not be found in our clinical trials database. It may not exist or might be spelled differently.
        </p>
        <div className="space-x-4">
          <Link 
            href="/treatments"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            ← Back to Treatments
          </Link>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
} 