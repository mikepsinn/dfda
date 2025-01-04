import { SiteConfig } from "@/types"

import { env } from "@/env.mjs"

export const siteConfig: SiteConfig = {
  name: env.NEXT_PUBLIC_SITE_NAME || "The Decentralized FDA",
  author: env.NEXT_PUBLIC_SITE_AUTHOR || "The Decentralized FDA",
  description:
    env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Eradicating disease with the power of real-world evidence",
  keywords: env.NEXT_PUBLIC_SITE_KEYWORDS
    ? env.NEXT_PUBLIC_SITE_KEYWORDS.split(",")
    : [],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: env.NEXT_PUBLIC_SITE_AUTHOR || "The Decentralized FDA",
  },
  links: {
    github: "https://github.com/decentralized-fda/decentralized-fda",
  },
  ogImage: env.NEXT_PUBLIC_SITE_OG_IMAGE || `${env.NEXT_PUBLIC_APP_URL}/og.png`,
  defaultHomepage: "/",
  afterLoginPath: "/dashboard",
}
