// Comparative effectiveness data for various conditions
export const comparativeEffectivenessData = {
  "Type 2 Diabetes": [
    { name: "Metformin", effectiveness: 87, trials: 245, participants: 35000, avgCost: 199 },
    { name: "GLP-1 Receptor Agonists", effectiveness: 82, trials: 178, participants: 28000, avgCost: 249 },
    { name: "SGLT2 Inhibitors", effectiveness: 79, trials: 156, participants: 24000, avgCost: 229 },
    { name: "DPP-4 Inhibitors", effectiveness: 72, trials: 189, participants: 30000, avgCost: 179 },
    { name: "Sulfonylureas", effectiveness: 68, trials: 210, participants: 32000, avgCost: 149 },
  ],
  "Rheumatoid Arthritis": [
    { name: "TNF Inhibitors", effectiveness: 85, trials: 156, participants: 22000, avgCost: 299 },
    { name: "JAK Inhibitors", effectiveness: 81, trials: 98, participants: 15000, avgCost: 349 },
    { name: "Methotrexate", effectiveness: 76, trials: 178, participants: 25000, avgCost: 199 },
    { name: "IL-6 Inhibitors", effectiveness: 74, trials: 87, participants: 12000, avgCost: 279 },
    { name: "Hydroxychloroquine", effectiveness: 65, trials: 134, participants: 18000, avgCost: 169 },
  ],
  Hypertension: [
    { name: "ACE Inhibitors", effectiveness: 88, trials: 267, participants: 40000, avgCost: 189 },
    { name: "ARBs", effectiveness: 86, trials: 234, participants: 35000, avgCost: 219 },
    { name: "Calcium Channel Blockers", effectiveness: 83, trials: 198, participants: 30000, avgCost: 199 },
    { name: "Thiazide Diuretics", effectiveness: 79, trials: 176, participants: 27000, avgCost: 159 },
    { name: "Beta Blockers", effectiveness: 75, trials: 210, participants: 32000, avgCost: 179 },
  ],
  Depression: [
    { name: "SSRIs", effectiveness: 80, trials: 289, participants: 45000, avgCost: 169 },
    { name: "SNRIs", effectiveness: 78, trials: 176, participants: 28000, avgCost: 189 },
    { name: "Bupropion", effectiveness: 75, trials: 145, participants: 22000, avgCost: 179 },
    { name: "Mirtazapine", effectiveness: 72, trials: 98, participants: 15000, avgCost: 159 },
    { name: "Tricyclic Antidepressants", effectiveness: 68, trials: 134, participants: 20000, avgCost: 149 },
  ],
  Asthma: [
    { name: "Inhaled Corticosteroids", effectiveness: 89, trials: 234, participants: 35000, avgCost: 229 },
    { name: "Long-Acting Beta Agonists", effectiveness: 85, trials: 198, participants: 30000, avgCost: 249 },
    { name: "Leukotriene Modifiers", effectiveness: 78, trials: 156, participants: 24000, avgCost: 199 },
    { name: "Short-Acting Beta Agonists", effectiveness: 76, trials: 178, participants: 27000, avgCost: 179 },
    { name: "Anticholinergics", effectiveness: 72, trials: 123, participants: 18000, avgCost: 189 },
  ],
  "Chronic Pain": [
    { name: "Gabapentinoids", effectiveness: 76, trials: 187, participants: 28000, avgCost: 199 },
    { name: "SNRIs", effectiveness: 74, trials: 156, participants: 24000, avgCost: 219 },
    { name: "Topical NSAIDs", effectiveness: 71, trials: 134, participants: 20000, avgCost: 179 },
    { name: "Opioids", effectiveness: 70, trials: 210, participants: 32000, avgCost: 249 },
    { name: "Acetaminophen", effectiveness: 65, trials: 178, participants: 27000, avgCost: 149 },
  ],
}

// Patient-focused benefits
export const patientBenefits = [
  {
    icon: "Percent",
    title: "80% Lower Cost",
    description: "Access treatments at a fraction of traditional healthcare costs.",
  },
  {
    icon: "Home",
    title: "100% Decentralized",
    description: "Participate entirely from home with no travel or clinic visits required.",
  },
  {
    icon: "Shield",
    title: "Enhanced Monitoring",
    description: "Receive closer health monitoring and personalized medical attention.",
  },
  {
    icon: "Wallet",
    title: "Transparent Pricing",
    description: "Clear, upfront pricing with no hidden fees or surprise costs.",
  },
]

