// Image constants used throughout the documentation
// All images are hosted at https://static.crowdsourcingcures.org/dfda/assets/

export const ASSET_BASE_URL = 'https://static.crowdsourcingcures.org/dfda/assets'

export interface ImageAsset {
  url: string
  alt: string
  description?: string
}

export const COST_IMAGES = {
  CLINICAL_TRIALS: {
    url: '/img/cost-of-clinical-trials.png',
    alt: 'Graph showing the high costs of clinical trials',
    description: 'Visualization of the $1.6 billion cost to bring a drug to market'
  },
  DRUG_DEVELOPMENT: {
    url: '/img/cost-to-develop-a-drug-chart.png',
    alt: 'Cost to develop a new drug',
    description: 'Chart showing the breakdown of drug development costs'
  },
  TRIAL_EXPENSES: {
    url: '/img/why-trials-are-so-expensive-cost.png',
    alt: 'Why clinical trials are expensive',
    description: 'Detailed breakdown of clinical trial costs'
  },
  HEALTHCARE_SPENDING: {
    url: '/img/life-expectancy-healthcare-spending.svg',
    alt: 'Healthcare spending vs life expectancy',
    description: 'Comparison of healthcare costs and life expectancy outcomes'
  }
} as const

export const STATISTICS_IMAGES = {
  WELLBUTRIN_SAMPLE_SIZE: {
    url: '/img/wellbutrin-effectiveness-small-sample-size.png',
    alt: 'Small sample size in Wellbutrin trials',
    description: 'Example of a drug prescribed to millions based on only 36 subjects'
  },
  OBSERVATIONAL_VS_RCT: {
    url: '/img/observational-vs-randomized-trial-effect-sizes.png',
    alt: 'Observational vs RCT effect sizes',
    description: 'Comparison of effect sizes between observational and randomized trials'
  },
  CLINICAL_STUDIES_COUNT: {
    url: '/img/number-of-clinical-research-studies.png',
    alt: 'Number of clinical research studies',
    description: 'Growth in number of clinical research studies over time'
  }
} as const

export const REGULATORY_IMAGES = {
  US_SWISS_LIFE_EXPECTANCY: {
    url: '/img/us-swiss-life-expectancy-5.png',
    alt: 'US vs Swiss life expectancy comparison',
    description: 'Graph showing divergence in life expectancy after 1962 US regulations'
  },
  US_SWISS_DRUG_APPROVALS: {
    url: '/img/us-swiss-life-expectancy-drug-approvals.png',
    alt: 'US vs Swiss life expectancy and drug approvals',
    description: 'Correlation between drug approval rates and life expectancy gap'
  },
  DRUG_LAG_EFFECTS: {
    url: '/img/drug-lag-swiss-us-life-expectancy-switzerland.png',
    alt: 'Drug lag effects on life expectancy',
    description: 'Impact of drug approval delays on US vs Swiss life expectancy'
  },
  FDA_SAFETY_TRIALS: {
    url: '/img/fda-safety-trials-life-expectancy.png',
    alt: 'FDA safety trials impact',
    description: 'Effect of FDA safety trials on life expectancy'
  }
} as const

export const LOGO_IMAGES = {
  DFDA_ICON_SVG: {
    url: '/img/dfda-icon.svg',
    alt: 'dFDA Icon',
    description: 'The dFDA icon in SVG format'
  },
  DFDA_ICON_PNG: {
    url: '/img/dfda-icon.png',
    alt: 'dFDA Icon',
    description: 'The dFDA icon in PNG format'
  },
  GITHUB: {
    url: '/img/GitHub.svg',
    alt: 'GitHub Logo',
    description: 'GitHub logo in SVG format'
  }
} as const

export const PROCESS_IMAGES = {
  DRUG_DEVELOPMENT: {
    url: '/img/drug-development-process.png',
    alt: 'Drug Development Process',
    description: 'Overview of the drug development process'
  },
  DRUG_EVALUATION: {
    url: '/img/drug-evaluation-process.png',
    alt: 'Drug Evaluation Process',
    description: 'Steps in the drug evaluation process'
  },
  DRUG_DISCOVERY_TIMELINE: {
    url: '/img/drug-discovery-and-development-timeline.png',
    alt: 'Drug Discovery Timeline',
    description: 'Timeline of drug discovery and development stages'
  }
} as const

export const AI_IMAGES = {
  AUTONOMOUS_RESEARCH: {
    url: '/img/autonomous-research-agent.png',
    alt: 'Autonomous Research Agent',
    description: 'Visualization of autonomous research agent system'
  },
  DIGITAL_TWIN: {
    url: '/img/digital-twin-safe.jpg',
    alt: 'Digital Twin',
    description: 'Concept of digital twin technology in healthcare'
  },
  ROBOT_SCIENTISTS: {
    url: '/img/robot-scientists.jpg',
    alt: 'Robot Scientists',
    description: 'AI-powered scientific research automation'
  },
  AGENT_OVERVIEW: {
    url: '/img/agent-overview.png',
    alt: 'Agent Overview',
    description: 'Overview of AI agent architecture'
  }
} as const

export const RESEARCH_IMAGES = {
  DECENTRALIZED_RESEARCH: {
    url: '/img/decentralized-research.png',
    alt: 'Decentralized Research',
    description: 'Visualization of decentralized research model'
  },
  OPEN_VS_CLOSED: {
    url: '/img/closed-source-competition-vs-open-source-collaboration.sketch.png',
    alt: 'Open vs Closed Source Research',
    description: 'Comparison of closed source competition vs open source collaboration'
  },
  DATA_IMPORT_ANALYSIS: {
    url: '/img/data-import-and-analysis.gif',
    alt: 'Data Import and Analysis',
    description: 'Animation showing data import and analysis process'
  }
} as const

export const NOTIFICATION_IMAGES = {
  WEB_NOTIFICATION: {
    url: '/img/web-notification-curcumin-300x253.jpg',
    alt: 'Web Notification Example',
    description: 'Example of web notification for treatment insights'
  },
  REAL_TIME_SUPPORT: {
    url: '/img/real-time-decision-support-notifications-personalized-app-image.jpg',
    alt: 'Real-time Decision Support',
    description: 'Real-time personalized decision support notifications'
  },
  ONSET_DELAY: {
    url: '/img/onset-delay-970x1024.jpg',
    alt: 'Treatment Onset Delay',
    description: 'Visualization of treatment onset delay analysis'
  }
} as const

export const ICON_IMAGES = {
  BRAIN: {
    url: '/img/Brain.svg',
    alt: 'Brain Icon',
    description: 'Brain icon representing intelligence/cognition'
  },
  BOT: {
    url: '/img/Bot.svg',
    alt: 'Bot Icon',
    description: 'Bot icon representing automation'
  },
  SKULL: {
    url: '/img/skull.svg',
    alt: 'Skull Icon',
    description: 'Skull icon representing mortality/risk'
  },
  IDEA: {
    url: '/img/Idea-brain-light-bulb.svg',
    alt: 'Idea Light Bulb',
    description: 'Light bulb icon representing ideas/innovation'
  }
} as const

// Combined object of all image categories
export const ALL_IMAGES = {
  COST_IMAGES,
  STATISTICS_IMAGES,
  REGULATORY_IMAGES,
  LOGO_IMAGES,
  PROCESS_IMAGES,
  AI_IMAGES,
  RESEARCH_IMAGES,
  NOTIFICATION_IMAGES,
  ICON_IMAGES
} as const

// Helper function to get image by key
export function getImage<
  C extends keyof typeof ALL_IMAGES,
  K extends keyof (typeof ALL_IMAGES)[C]
>(category: C, key: K): (typeof ALL_IMAGES)[C][K] {
  return ALL_IMAGES[category][key]
} 