import React from "react"

import OpenSource from "@/components/pages/opensource"
import { PWARedirect } from "@/components/pwa-redirect";
import DFDAHomePage from "@/app/components/dfda-home-page";


export default async function Home() {
  return (
      <main>
          <DFDAHomePage />
          <OpenSource/>
          <PWARedirect/>
      </main>
  )
}