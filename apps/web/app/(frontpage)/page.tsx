import React from "react"

import { getCurrentUser } from "@/lib/session"
import OpenSource from "@/components/pages/opensource"
import { PWARedirect } from "@/components/pwa-redirect";
import DFDAHomePage from "@/app/components/dfda-home-page";


export default async function Home() {
  const user = await getCurrentUser()
  return (
      <main>
          <DFDAHomePage />
          <OpenSource/>
          <PWARedirect/>
      </main>
  )
}