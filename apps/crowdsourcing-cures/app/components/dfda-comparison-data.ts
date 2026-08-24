export interface ComparisonItem {
  category: string
  regularFDA: {
    value: string
    content: string
    icon?: string
  }
  decentralizedFDA: {
    value: string
    content: string
    icon?: string
  }
}

export const comparisonData: ComparisonItem[] = [
  {
    category: "⏱️ Years Until Patients Can Access Treatment",
    regularFDA: {
      value: "17 years",
      icon: "⏳",
      content: `# Time to Treatment is Too Long 📅

The current clinical trial process takes far too long, causing unnecessary suffering and death. Here's why:

## Current Timeline: 17 Years Average
- Protocol Development: 2 years
- Site Selection: 1 year
- Patient Recruitment: 2 years
- Trial Duration: 3 years
- Data Analysis: 1 year
- FDA Review: 2 years
- Post-Market Studies: 6 years

## Key Problems
- Each phase requires extensive paperwork and bureaucracy
- Site selection and setup is time consuming
- Patient recruitment is slow and difficult
- Data collection and verification takes too long
- Review process has many delays
- Post-market studies drag on for years

## Impact
- Patients suffer and die waiting for treatments
- Researchers waste time on administrative tasks
- Promising treatments are abandoned due to delays
- Innovation is stifled by long timelines
- Healthcare costs increase due to inefficiency`
    },
    decentralizedFDA: {
      value: "➡️ 2 years",
      icon: "🚀",
      content: `# Dramatically Faster Treatment Access ⚡

The DFDA enables a much faster path to treatment while maintaining safety:

## New Timeline: 2 Years Average
- Protocol Development: 2 months (AI-assisted)
- Patient Recruitment: 1 month (direct-to-patient)
- Trial Duration: 6 months (real-world data)
- Data Analysis: 1 month (automated)
- Review Process: 5 months (continuous)
- Post-Market: Ongoing monitoring

## Key Improvements
- AI-assisted protocol development
- Direct patient recruitment
- Real-world data collection
- Automated analysis
- Continuous review process
- Real-time safety monitoring

## Benefits
- Faster access to treatments
- Reduced patient suffering
- More efficient use of resources
- Increased innovation
- Lower healthcare costs
- Better safety monitoring`
    }
  },
  {
    category: "💰 Cost of Clinical Trials",
    regularFDA: {
      value: "$57M",
      icon: "💸",
      content: `# Clinical Research is Too Expensive 💰

The current clinical trial process is prohibitively expensive, limiting innovation and access to treatments.

## Current Costs: [$57M Average Per Trial](https://aspe.hhs.gov/reports/examination-clinical-trial-costs-barriers-drug-development-0)
- Site Costs: $7.4M
- Staff Costs: $4.3M
- Administrative: $7.2M
- Other Costs: $38.1M

## Key Cost Drivers
- Multiple physical trial sites
- Large administrative staff
- Complex paperwork requirements
- Lengthy timelines
- High patient recruitment costs
- Expensive data collection

## Impact
- Many promising treatments never get tested
- Small patient populations are ignored
- Innovation is limited to large companies
- Healthcare costs are inflated
- Research focuses on profitable areas only

Sources:
- [ASPE - Clinical Trial Costs](https://aspe.hhs.gov/reports/examination-clinical-trial-costs-barriers-drug-development-0)
`
    },
    decentralizedFDA: {
      value: "➡️ $2M",
      icon: "💎",
      content: `# Dramatically Lower Research Costs 📉

The DFDA enables much more cost-effective research while improving quality:

## New Costs: $2M Average Per Trial
- Virtual Sites: $0
- Core Staff: $250K
- Administration: $100K
- Technology: $1.65M

## Cost Reductions
- No physical sites needed
- Minimal administrative overhead
- Automated data collection
- Faster timelines
- Direct patient recruitment
- Efficient technology platform

## Benefits
- 96% cost reduction
- More treatments tested
- Rare diseases get attention
- Smaller companies can innovate
- Lower healthcare costs
- Better research coverage

Sources:
- [Business Wire - DFDA Study](https://www.businesswire.com/news/home/20220113005740/en/New-Study-Decentralized-Clinical-Trials-Can-Achieve-Net-Financial-Benefits-of-5X-to-14X-Due-to-Reduced-Trial-Timelines-and-Other-Factors)
`
    }
  },
  {
    category: "👥 Percent of Patients Able to Join Trials",
    regularFDA: {
      value: "15%",
      icon: "🚫",
      content: `# Trials Aren't Representative of Real Patients 🏥

Current clinical trials exclude most patients, leading to poor real-world results.

## Current Exclusions
- 60% excluded due to location
- 45% excluded by strict criteria
- 30% excluded by scheduling
- 25% excluded by language
- Only 15% can participate

## Key Problems
- Geographic limitations
- Strict inclusion criteria
- Rigid scheduling
- Language barriers
- Transportation issues
- Work conflicts
- Childcare needs

## Impact
- Results don't reflect reality
- Many patients can't access trials
- Treatments may not work as expected
- Health disparities increase
- Innovation is limited

Sources:
- [Clinical Leader - Patient Exclusions](https://www.clinicalleader.com/doc/getting-a-handle-on-clinical-trial-costs-0001)
`
    },
    decentralizedFDA: {
      value: "➡️ 100%",
      icon: "✨",
      content: `# Universal Trial Access 🌍

The DFDA enables all patients to participate in research:

## New Approach
- Remote participation
- Flexible criteria
- Patient-centric scheduling
- Any language supported
- No travel required
- Work-friendly
- Family-friendly

## Key Features
- Virtual trial sites
- Real-world data collection
- Automated translation
- Flexible scheduling
- Remote monitoring
- Direct communication

## Benefits
- Better representation
- More accurate results
- Equal access for all
- Reduced disparities
- Faster recruitment
- Better outcomes`
    }
  }
]
