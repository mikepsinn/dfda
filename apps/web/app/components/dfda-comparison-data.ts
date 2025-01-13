export interface ComparisonItem {
  category: string
  regularFDA: string
  decentralizedFDA: string
  details: string
}

export const comparisonData: ComparisonItem[] = [
  {
    category: "⏱️ Years Until Patients Can Access Treatment",
    regularFDA: "17",
    decentralizedFDA: "➡️ 2",
    details: `
Traditional: 17 years
- Protocol: 2 years
- Recruitment: 2 years
- Trial: 3 years
- Analysis: 1 year
- Review: 2 years

DFDA: 2 years
- Protocol: 2 months
- Recruitment: 1 month
- Trial: 6 months
- Analysis: 1 month
- Review: 5 months`,
  },
  {
    category: "💰 Cost to Develop Treatment",
    regularFDA: "$57M",
    decentralizedFDA: "➡️ $2M",
    details: `
Current: $57M/trial
- Sites: $7.4M
- Staff: $4.3M
- Admin: $7.2M
- Other: $38.1M

DFDA: $2M/trial
- Sites: $0
- Staff: $250K
- Admin: $100K
- Other: $1.65M

96% total cost reduction`,
  },
  {
    category: "👥 Patients Who Can Join Trials",
    regularFDA: "15%",
    decentralizedFDA: "➡️ 100%",
    details: `
Current exclusions:
- 60% due to location
- 45% due to criteria
- 30% due to scheduling
- 25% due to language

DFDA enables:
- Remote participation
- Flexible criteria
- No site visits
- Any language`,
  }
]
