import Link from "next/link"

// Shown while a browser previews a company instance through its /i/{slug} link.
export function PreviewBar({ name }: { name: string }) {
  return (
    <div className="bg-foreground px-4 py-1.5 text-center text-xs text-background">
      Preview of {name}.{" "}
      {/* No prefetch: opening /i ends the preview. */}
      <Link href="/i" prefetch={false} className="font-medium underline underline-offset-2">
        Exit preview
      </Link>
    </div>
  )
}
