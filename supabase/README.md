# Decentralized FDA Database Structure

A decentralized platform for clinical trials, real-world evidence, and treatment effectiveness rankings.

## Database Schema Organization

The database is organized into logical schemas, each handling specific aspects of the decentralized FDA platform. Migrations are grouped by functionality in numbered folders.

### Migration Structure

```
migrations/
├── 100_core/                    # Core user profiles and authentication
│   ├── 101_core_schema.sql
│   └── 102_profiles.sql
│
├── 125_medical_ref/            # Medical reference data
│   ├── 101_medical_ref_schema.sql
│   ├── 102_conditions.sql
│   ├── 103_treatments.sql
│   ├── 104_variables.sql
│   └── 105_units.sql
│
├── 150_aggregate/              # Global data aggregation
│   ├── 101_aggregate_schema.sql
│   ├── 102_treatment_ratings_views.sql
│   ├── 103_aggregate_user_variable_relationships.sql
│   └── 104_aggregate_user_variable_stats.sql
│
├── 175_cohort/                # Patient cohort analysis
│   ├── 101_cohort_schema.sql
│   ├── 102_cohort_definitions.sql
│   └── 103_cohort_analytics.sql
│
├── 200_trials/                # Clinical trials management
│   ├── 101_trials_schema.sql
│   ├── 102_trial_protocols.sql
│   ├── 103_trial_participants.sql
│   └── 104_trial_outcomes.sql
│
├── 225_evidence/              # Real-world evidence collection
│   ├── 101_evidence_schema.sql
│   ├── 102_user_observations.sql
│   └── 103_evidence_quality.sql
│
└── 250_rankings/              # Treatment effectiveness rankings
    ├── 101_rankings_schema.sql
    ├── 102_treatment_scores.sql
    └── 103_comparative_effectiveness.sql
```

### Schema Descriptions

1. **core** - Foundation schema containing:
   - User profiles
   - Authentication
   - Base permissions

2. **medical_ref** - Medical reference data:
   - Conditions/diseases
   - Treatments/interventions
   - Outcome variables
   - Units of measurement
   - Standard terminologies

3. **aggregate** - Global data aggregation:
   - Treatment effectiveness ratings
   - User-reported outcomes
   - Variable relationships
   - Statistical aggregations

4. **cohort** - Patient cohort functionality:
   - Cohort definitions
   - Group characteristics
   - Comparative analysis

5. **trials** - Clinical trials management:
   - Trial protocols
   - Participant management
   - Outcome tracking
   - Adverse events
   - Trial documentation

6. **evidence** - Real-world evidence:
   - User observations
   - Evidence quality metrics
   - Data validation rules
   - Source credibility

7. **rankings** - Treatment effectiveness:
   - Comparative rankings
   - Evidence-based scores
   - Treatment comparisons
   - Effectiveness metrics

## Key Features

- Row-level security (RLS) policies for data privacy
- Automated aggregation of trial and real-world data
- Evidence quality scoring system
- Treatment effectiveness rankings
- Cohort-based analysis capabilities

## Design Principles

1. **Decentralization**
   - Distributed data collection
   - Community-driven evidence
   - Transparent ranking algorithms

2. **Data Quality**
   - Evidence validation
   - Quality scoring
   - Source verification

3. **Privacy**
   - Row-level security
   - Data anonymization
   - Controlled access

4. **Scalability**
   - Modular schema design
   - Efficient aggregations
   - Performance optimization

## Getting Started

1. Run migrations in numerical order (100 → 250)
2. Each subfolder contains migrations in sequence (101, 102, etc.)
3. Schema creation must precede table creation
4. Core schema is a prerequisite for all other schemas

## Development Guidelines

1. Place new features in appropriate numbered folders
2. Maintain sequential numbering for migrations
3. Document schema changes in migration files
4. Test RLS policies for each table
5. Consider impact on existing aggregations 