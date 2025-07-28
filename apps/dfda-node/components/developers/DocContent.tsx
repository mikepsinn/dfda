"use client"

import { useEffect, useRef } from "react"
import { DocIntroductionSection } from "./DocIntroductionSection"
import { DocAuthenticationSection } from "./DocAuthenticationSection"
import { DocEndpointsSection } from "./DocEndpointsSection"
import { DocErrorHandlingSection } from "./DocErrorHandlingSection"
import { DocRateLimitingSection } from "./DocRateLimitingSection"
import { DocSdkSection } from "./DocSdkSection"
import { DocSupportSection } from "./DocSupportSection"

export function DocContent() {
  const contentRef = useRef<HTMLDivElement>(null)

  // Add a useLayoutEffect to stabilize layout before ResizeObserver runs
  useEffect(() => {
    // Force a stable layout by ensuring content has a fixed width initially
    if (contentRef.current) {
      const contentElement = contentRef.current;
      const originalWidth = contentElement.style.width
      contentElement.style.width = `${contentElement.offsetWidth}px`

      // After a short delay, restore original width to allow natural resizing
      const timer = setTimeout(() => {
        if (contentElement) {
          contentElement.style.width = originalWidth
        }
      }, 100)

      return () => {
        clearTimeout(timer)
        if (contentElement) {
          contentElement.style.width = originalWidth
        }
      }
    }
  }, [])

  // Replace the existing cleanup useEffect with:
  useEffect(() => {
    // Capture the ref value at the beginning of the effect
    const currentContentRef = contentRef.current;
    
    return () => {
      // Force any ResizeObservers to disconnect by ensuring the element
      // has a stable size when unmounting
      if (currentContentRef) {
        currentContentRef.style.height = "auto"
        currentContentRef.style.width = "auto"
      }
    }
  }, [])

  return (
    <div className="max-w-3xl" ref={contentRef}>
      <DocIntroductionSection />
      <DocAuthenticationSection />
      <DocEndpointsSection />
      <DocErrorHandlingSection />
      <DocRateLimitingSection />
      <DocSdkSection />
      <DocSupportSection />
    </div>
  )
}
