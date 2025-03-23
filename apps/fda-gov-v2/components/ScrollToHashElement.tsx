"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function ScrollToHashElement() {
  const pathname = usePathname()

  useEffect(() => {
    // If there's a hash in the URL
    if (window.location.hash) {
      // Get the element by id (without the # character)
      const id = window.location.hash.substring(1)
      const element = document.getElementById(id)

      if (element) {
        // Wait a bit for the page to fully render and then scroll
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    }
  }, [pathname]) // Re-run only when the pathname changes

  return null // This component doesn't render anything
}

