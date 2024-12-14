import { SiteConfig } from "@/types"

export const domainConfigs: Record<string, SiteConfig> = {
  "dfda.earth": {
    name: "The Decentralized FDA",
    description: "Crowdsourcing clinical research",
    author: "mikepsinn",
    keywords: ["clinical research", "health data", "desci"],
    defaultHomepage: "/dfda",
    afterLoginPath: "/dfda",
    ogImage: "/globalSolutions/dfda/dfda-og.png",
    url: {
      base: "https://dfda.earth",
      author: "mikepsinn",
    },
    links: {
      github: "https://github.com/dfda/dfda",
    },
  },
}