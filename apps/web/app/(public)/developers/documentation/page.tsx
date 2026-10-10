import { permanentRedirect } from "next/navigation"

// The developer documentation is on /developers.
export default function DeveloperDocumentation() {
  permanentRedirect("/developers")
}
