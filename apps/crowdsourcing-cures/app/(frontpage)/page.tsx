import React from "react"

import { PWARedirect } from "@/components/pwa-redirect"
import DFDAHomePage from "@/app/components/dfda-home-page"

export default function Home() {
  return (
    <main>
      <DFDAHomePage />
      <PWARedirect />
    </main>
  )
}
