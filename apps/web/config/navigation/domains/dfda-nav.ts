import { DomainNavigation } from "../nav-types"
import { commonLinks } from "../shared-links"

export const PATH_TO_DISEASE_ERADICATION_ACT =
  "docs/disease-eradication-act/disease-eradication-act.md"

export const dfdaLinks = {
  dfda: {
    title: "Home",
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
  variables: {
    title: "Variables",
    href: "/variables",
    icon: "activity",
    tooltip: "Browse health variables, measurements, and outcomes",
  },
  studies: {
    title: "Studies",
    href: "/studies",
    icon: "studies",
    tooltip: "Browse population studies",
  },
  trials: {
    title: "Trials",
    href: "/trials",
    icon: "trials",
    tooltip: "Clinical trials",
  },
  predictorSearch: {
    title: "Find Predictors",
    href: "/predictor-search",
    icon: "lightbulb",
    tooltip: "Find factors associated with an outcome",
  },
  variableCategories: {
    title: "Variable Categories",
    href: "/variable-categories",
    icon: "sort",
    tooltip: "Explore variables by category",
  },
  createStudy: {
    title: "Create a Study",
    href: "/study/create",
    icon: "add",
    tooltip: "Create a personalized or population study",
  },
  costBenefitAnalyses: {
    title: "Cost-Benefit Analyses",
    href: "/cba",
    icon: "savings",
    tooltip: "Compare the costs and benefits of health interventions",
  },
  articles: {
    title: "Articles",
    href: "/articles",
    icon: "book",
    tooltip: "Read health research articles",
  },
  digitalTwinSafe: {
    title: "Digital Twin Safe",
    href: "/safe/redirect",
    icon: "safe",
    tooltip: "Import, record and analyze your medical data",
  },
  clinipedia: {
    title: "Clinipedia",
    href: "https://studies.dfda.earth",
    icon: "studies",
    tooltip: "The Wikipedia of Clinical Research",
    external: true,
  },
  fdai: {
    title: "FDAi",
    href: "https://fdai.earth",
    icon: "robot",
    tooltip: "An autonomous AI Food and Drug Administration",
    external: true,
  },
  petition: {
    title: "Disease Eradication Initiative",
    href: "/docs/disease-eradication-act",
    icon: "petition",
    tooltip:
      "Help us end suffering by signing the Global Disease Eradication Initiative",
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
    title: "Edit Disease Eradication Initiative",
    href:
      "https://github.com/decentralized-fda/decentralized-fda/edit/master/apps/web/public/" +
      PATH_TO_DISEASE_ERADICATION_ACT,
    icon: "edit",
    tooltip: "Edit the Disease Eradication Initiative",
  },
} as const

export const dfdaNavigation: DomainNavigation = {
  topNav: [
    dfdaLinks.dfda,
    dfdaLinks.conditions,
    dfdaLinks.treatments,
    dfdaLinks.variables,
    dfdaLinks.studies,
    dfdaLinks.trials,
  ],
  exploreNav: [
    dfdaLinks.predictorSearch,
    dfdaLinks.variableCategories,
    dfdaLinks.createStudy,
    dfdaLinks.costBenefitAnalyses,
    dfdaLinks.articles,
    dfdaLinks.petition,
    dfdaLinks.digitalTwinSafe,
    dfdaLinks.clinipedia,
    dfdaLinks.fdai,
    dfdaLinks.dfdaDocs,
  ],
  sidebarNav: [
    dfdaLinks.dfda,
    dfdaLinks.conditions,
    dfdaLinks.treatments,
    dfdaLinks.variables,
    dfdaLinks.studies,
    dfdaLinks.trials,
    dfdaLinks.predictorSearch,
    dfdaLinks.variableCategories,
    dfdaLinks.createStudy,
    dfdaLinks.costBenefitAnalyses,
    dfdaLinks.articles,
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
