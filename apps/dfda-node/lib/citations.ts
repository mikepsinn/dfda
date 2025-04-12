export interface Citation {
  title: string
  url: string
  quote?: string
  context?: string
  author?: string
  publishedDate?: string
  accessedDate?: string // Optional: useful if source might change
}

export const heroSectionCitations: Record<string, Citation[]> = {
  costPerPatient: [
    {
      title: "Revolutionizing Clinical Trials: Scaling RECOVERY's Efficiency...",
      url: "https://wiki.dfda.earth/en/reference/recovery-trial",
      quote: "Traditional Trial Cost per Patient: ~$41,000 (Source: NCBI)",
      context: "Provides a source for the high cost of traditional trials.",
      accessedDate: "2024-08-22",
    },
    {
      title: "Revolutionizing Clinical Trials: Scaling RECOVERY's Efficiency...",
      url: "https://wiki.dfda.earth/en/reference/recovery-trial",
      quote: "At approximately £43 (~$55) per patient, this is nearly 750 times more cost-efficient...", // Moved comment: Cites ~$500 from Manhattan Institute.
      context:
        "Highlights the drastic cost reduction achieved in the RECOVERY trial, supporting the ~$450 figure used for FDA v2. Note: HeroSection uses $36k vs $450.",
      accessedDate: "2024-08-22",
    },
    {
      title: "Assessing the Financial Value of Decentralized Clinical Trials",
      url: "https://link.springer.com/content/pdf/10.1007/s43441-022-00454-5.pdf",
      author: "DiMasi et al.",
      publishedDate: "2022-09-14",
      quote: `If we assume that DCT methods are applied to both phase II and phase III trials the increase in value is $20 million per drug that enters phase II, with a seven-fold ROI.`,
      context: "Demonstrates substantial overall financial value and ROI for DCTs.",
    },
  ],
  timeToLaunch: [
    {
      title: "Objective: Disease Eradication",
      url: "https://wiki.dfda.earth/",
      quote: "Years Until Patients Can Access Treatment: 17 years -> 2 years",
      context: "Highlights a major reduction in the overall drug development timeline with the proposed FDA v2 model.",
      accessedDate: "2024-08-22",
    },
    {
      title: "Decentralized or Traditional? Clinical Trials in Comparison",
      url: "https://climedo.de/en/blog/decentralized-or-traditional-clinical-trials-in-comparison/",
      publishedDate: "2021-11-11",
      quote: `80% of all traditional clinical trials are not completed on time and one-fifth of them experience delays of at least six months. choosing a decentralized study can save almost 3 months until completion.`,
      context:
        "Indicates common delays in traditional trials and time savings in DCT completion. Does not directly confirm the 6-12mo vs 2-4wk *launch* times used in HeroSection.",
    },
    {
      title: "Decentralized trial sees increased adherence to heart medication",
      url: "https://www.huma.com/blog-post/decentralized-trial-sees-increased-adherence-to-heart-medication",
      publishedDate: "2022-07-21",
      quote: "...the DeTAP trial recruited 94 patients in just 12 days using social media (vs 6 in 28 days using traditional methods)...",
      context: "Demonstrates significantly faster *recruitment* speed in a specific DCT.",
    },
  ],
  patientRetention: [
    {
      title:
        "Building clinical trials around patients: Evaluation and comparison of decentralized and conventional site models in patients with low back pain",
      url: "https://pubmed.ncbi.nlm.nih.gov/30094387",
      author: "Sommer et al.",
      publishedDate: "2018-06-28",
      quote: "In the decentralized arm 89% of enrolled patients completed the study compared to 60% in the conventional arm.",
      context: "Shows higher study completion (lower dropout) rate in a decentralized vs conventional setting.",
    },
    {
      title: "Clinical trial transformation",
      url: "https://www.drugdiscoverynews.com/-clinical-trial-transformation-15077",
      publishedDate: "2021-03-25",
      quote:
        "...decentralized clinical trials far outperformed traditional trials in patient recruitment and retention during the first three quarters of 2020.",
      context: "Reports on a study showing superior DCT retention compared to traditional trials.",
    },
    {
      title: "No place like home? Stepping up the decentralization of clinical trials",
      url: "https://www.mckinsey.com/industries/life-sciences/our-insights/no-place-like-home-stepping-up-the-decentralization-of-clinical-trials",
      publishedDate: "2021-06-10",
      quote: "Typically, 70 percent of potential participants live more than two hours from trial sites...",
      context:
        "Potential source for the '70%' figure, although it refers to distance/access, not directly to retention rate. The 92% figure in HeroSection lacks a direct source in these findings.",
    },
  ],
  dataQuality: [
    {
      title:
        "Data Quality of Longitudinally Collected Patient-Reported Outcomes After Thoracic Surgery: Comparison of Paper- and Web-Based Assessments",
      url: "https://pubmed.ncbi.nlm.nih.gov/34751657",
      author: "Yu et al.",
      publishedDate: "2021-09-11",
      quote:
        "Patients who completed ePRO had fewer errors than those who completed P&P assessments (ePRO: 30.2% [57/189] vs. P&P: 57.7% [254/440]; P<.001).",
      context:
        "Directly compares paper (traditional) vs. electronic (common in DCTs) data collection, showing significantly fewer errors with electronic methods, supporting 'High' quality for DCTs.",
    },
    {
      title:
        "Impact of source data verification on data quality in clinical trials: an empirical post hoc analysis of three phase 3 randomized clinical trials",
      url: "https://ncbi.nlm.nih.gov/pmc/articles/PMC4386950/",
      author: "Mitchel et al.",
      publishedDate: "2014-10-19",
      quote: "An overall error rate of 0.45% was found. No sites had 0% errors... Complete SDV yielded an error rate of 0.27% as compared with partial SDV having an error rate of 0.53%...",
      context:
        "Shows that errors exist even with traditional Source Data Verification (SDV), challenging the idea of perfect data quality and supporting 'Variable' quality for traditional methods.",
    },
  ],
} 