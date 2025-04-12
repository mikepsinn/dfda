export function DeveloperTestimonials() {
  return (
    <div className="mt-16 bg-primary/5 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-center mb-8">Trusted by Leading Health Tech Companies</h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-background rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="font-bold text-blue-600">HC</span>
            </div>
            <div>
              <h3 className="font-medium">HealthConnect</h3>
              <p className="text-sm text-muted-foreground">Digital Health Platform</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">
            "The FDA.gov v2 API has been transformative for our patient engagement platform. We&apos;ve seen a
            43% increase in clinical trial participation and significantly improved patient outcomes."
          </p>
        </div>

        <div className="bg-background rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="font-bold text-green-600">MR</span>
            </div>
            <div>
              <h3 className="font-medium">MedRecord</h3>
              <p className="text-sm text-muted-foreground">EHR Solutions</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">
            "Integrating with the FDA.gov v2 API allowed us to offer our providers real-time access to
            comparative effectiveness data, improving clinical decision-making and patient care."
          </p>
        </div>

        <div className="bg-background rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="font-bold text-purple-600">TM</span>
            </div>
            <div>
              <h3 className="font-medium">TrialMatch</h3>
              <p className="text-sm text-muted-foreground">Clinical Trial Platform</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">
            "The OAuth2 integration with FDA.gov v2 has streamlined our trial enrollment process, reducing
            patient onboarding time by 67% and dramatically improving our data collection capabilities."
          </p>
        </div>
      </div>
    </div>
  )
} 