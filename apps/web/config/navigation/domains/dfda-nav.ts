import { DomainNavigation } from "../nav-types"
import { commonLinks } from "../shared-links"

export const dfdaLinks = {
  dfda: {
    title: "dFDA",
    href: "/",
    icon: "home",
    tooltip: "The Decentralized Food and Drug Administration",
  },
  conditions: {
    title: "Conditions",
    href: "/conditions",
    icon: "health",
    tooltip: "Conditions and treatments",
  },
  treatments: {
    title: "Treatments",
    href: "/treatments",
    icon: "treatment",
    tooltip: "Treatments and conditions",
  },
  digitalTwinSafe: {
    title: "Digital Twin Safe",
    href: "/safe/redirect",
    icon: "safe",
    tooltip: "Import, record and analyze your medical data",
  },
  clinipedia: {
    title: "Studies",
    href: "https://studies.dfda.earth",
    icon: "studies",
    tooltip: "The Wikipedia of Clinical Research",
  },
  fdai: {
    title: "FDAi",
    href: "https://fdai.earth",
    icon: "robot",
    tooltip: "An autonomous AI Food and Drug Administration",
  },
  petition: {
    title: "Disease Eradication Act",
    href: "/docs/disease-eradication-act",
    icon: "petition",
    tooltip: "Help us end suffering by signing the Global Disease Eradication Act",
  },
  healthSavingsSharing: {
    title: "50/50 Health Savings Sharing Program",
    href: "/docs/health-savings-sharing",
    icon: "savings",
    tooltip:
      "Incentivizing Cures With 50% of Long Term Healthcare Savings from Curative or Preventative Treatments",
  },
  dfdaDocs: {
    title: "Docs",
    href: "/docs",
    icon: "book",
    tooltip: "Documentation for the Decentralized FDA",
  },
  editDiseaseEradicationAct: {
    title: "Edit Disease Eradication Act",
    href: "https://github.com/decentralized-fda/decentralized-fda/edit/master/apps/web/public/docs/disease-eradication-act.md",
    icon: "edit",
    tooltip: "Edit the Disease Eradication Act",
  },
} as const

export const dfdaNavigation: DomainNavigation = {
  topNav: [
    dfdaLinks.clinipedia,
    dfdaLinks.digitalTwinSafe,
    dfdaLinks.petition,
    commonLinks.contributeOnGithub,
  ],
  sidebarNav: [
    dfdaLinks.dfda,
    dfdaLinks.conditions,
    dfdaLinks.treatments,
    dfdaLinks.clinipedia,
    dfdaLinks.digitalTwinSafe,
    dfdaLinks.fdai,
    dfdaLinks.petition,
    dfdaLinks.healthSavingsSharing,
    commonLinks.contributeOnGithub,
    commonLinks.reportBug,
    commonLinks.requestFeature,
    dfdaLinks.dfdaDocs,
  ],
  avatarNav: [
    dfdaLinks.dfda,
    dfdaLinks.clinipedia,
    dfdaLinks.digitalTwinSafe,
    dfdaLinks.fdai,
    dfdaLinks.petition,
    dfdaLinks.healthSavingsSharing,
    commonLinks.reportBug,
    commonLinks.requestFeature,
    commonLinks.contributeOnGithub,
    dfdaLinks.dfdaDocs,
  ],
  footerNav: [
    dfdaLinks.dfda,
    dfdaLinks.clinipedia,
    dfdaLinks.digitalTwinSafe,
    dfdaLinks.fdai,
    dfdaLinks.petition,
    dfdaLinks.healthSavingsSharing,
    commonLinks.reportBug,
    commonLinks.requestFeature,
    commonLinks.contributeOnGithub,
    dfdaLinks.dfdaDocs,
  ],
}
