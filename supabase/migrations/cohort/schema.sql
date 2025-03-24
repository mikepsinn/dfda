-- Cohort Schema
-- Contains aggregated data for specific patient groups/cohorts
CREATE SCHEMA cohort;

-- Core tables
\ir tables/protocols.sql
\ir tables/arms.sql
\ir tables/interventions.sql
\ir tables/participants.sql
\ir tables/documents.sql
\ir tables/outcomes.sql
\ir tables/data_points.sql
\ir tables/adverse_events.sql 