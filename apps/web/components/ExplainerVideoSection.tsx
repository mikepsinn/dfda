// The two-minute explainer (built from videos/right-to-trial in this repo), on the static R2 bucket.
// The files are cached for a year, so each new render gets a new dated file name.
const video = "https://static.warondisease.org/care-integrated-clinical-trials-explainer-2026-10-05.mp4"
const poster = "https://static.warondisease.org/care-integrated-clinical-trials-explainer-2026-10-05-poster.jpg"

export function ExplainerVideoSection() {
  return (
    // Sits under the hero, on the same muted band as the rankings section below it.
    <section aria-labelledby="explainer-heading" className="band-muted w-full pb-12 md:pb-16">
      <div className="container px-4 md:px-6">
        {/* The poster already shows the title, so the heading is for screen readers. */}
        <h2 id="explainer-heading" className="sr-only">Care-integrated clinical trials, explained in two minutes</h2>
        {/* The captions are part of the picture, so it works muted; it only loads when played. */}
        <video
          className="mx-auto aspect-video w-full max-w-4xl rounded-lg border bg-black shadow-sm"
          controls
          playsInline
          preload="none"
          poster={poster}
        >
          <source src={video} type="video/mp4" />
        </video>
      </div>
    </section>
  )
}
