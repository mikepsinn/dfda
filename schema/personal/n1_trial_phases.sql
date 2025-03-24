-- Create tables for N-1 trial tracking and analysis
CREATE TABLE IF NOT EXISTS personal.n1_trial_phases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    variable_id uuid NOT NULL REFERENCES reference.variables(id) ON DELETE CASCADE,
    start_date timestamptz NOT NULL,
    end_date timestamptz,
    phase_type text NOT NULL CHECK (phase_type IN (
        'pre_treatment',    -- Initial baseline
        'washout',         -- Medication-free period
        'stable_period',   -- Stable baseline
        'experimental',    -- Treatment/intervention period
        'crossover',       -- When switching between conditions
        'follow_up'        -- Post-intervention monitoring
    )),
    phase_order integer, -- For ordering phases in crossover designs
    comparison_phase_id uuid REFERENCES personal.n1_trial_phases(id), -- For explicit phase comparisons
    
    -- Intervention details (for experimental phases)
    intervention_variable_id uuid REFERENCES reference.variables(id), -- What's being tested
    target_dosage numeric,
    target_frequency text,
    schedule jsonb, -- Detailed timing/protocol schedule
    prescription_details jsonb, -- For medications: prescriber, pharmacy, rx number
    
    -- Tracking and Analysis
    adherence_rate numeric CHECK (adherence_rate >= 0 AND adherence_rate <= 100),
    side_effects jsonb,
    effectiveness_rating integer CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    cost_per_unit numeric,
    total_cost numeric,
    
    -- Protocol and Notes
    phase_protocol jsonb, -- Overall phase protocol including measurement schedule
    notes text,
    deleted_at timestamptz, -- Soft delete support
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > start_date),
    -- Ensure intervention details for experimental phases
    CONSTRAINT intervention_required CHECK (
        (phase_type = 'experimental' AND intervention_variable_id IS NOT NULL) OR
        (phase_type != 'experimental' AND intervention_variable_id IS NULL)
    ),
    -- Ensure unique trial phases per user/variable/intervention combination
    CONSTRAINT unique_user_trial_phase UNIQUE NULLS NOT DISTINCT 
        (user_id, variable_id, intervention_variable_id, start_date, phase_type)
);

-- Create view for severity changes (replacing table)
CREATE OR REPLACE VIEW personal.n1_trial_severity_changes AS
WITH BaselineStats AS (
    SELECT 
        tp.id AS reference_phase_id,
        tp.user_id,
        tp.variable_id,
        AVG(vm.value) AS reference_value,
        STDDEV(vm.value) AS reference_stddev
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        tp.user_id = vm.user_id AND 
        tp.variable_id = vm.variable_id AND
        vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, vm.measurement_time)
    WHERE tp.phase_type IN ('pre_treatment', 'washout', 'stable_period')
    GROUP BY tp.id, tp.user_id, tp.variable_id
)
SELECT 
    vm.id,
    vm.user_id,
    vm.variable_id,
    bs.reference_phase_id,
    vm.measurement_time,
    bs.reference_value,
    vm.value AS current_value,
    vm.unit_id,
    (vm.value - bs.reference_value) AS absolute_change,
    CASE 
        WHEN bs.reference_value != 0 
        THEN ((vm.value - bs.reference_value) / ABS(bs.reference_value)) * 100 
        ELSE NULL 
    END AS percent_change,
    CASE
        WHEN (vm.value - bs.reference_value) <= -2 * bs.reference_stddev THEN 'much_improved'
        WHEN (vm.value - bs.reference_value) <= -1 * bs.reference_stddev THEN 'improved'
        WHEN (vm.value - bs.reference_value) BETWEEN -1 * bs.reference_stddev AND bs.reference_stddev THEN 'no_change'
        WHEN (vm.value - bs.reference_value) >= 2 * bs.reference_stddev THEN 'much_worsened'
        WHEN (vm.value - bs.reference_value) >= bs.reference_stddev THEN 'worsened'
    END AS severity_change,
    CASE
        WHEN ABS(vm.value - bs.reference_value) >= 2 * bs.reference_stddev THEN true
        ELSE false
    END AS is_clinically_significant,
    NULL::text as notes,
    vm.created_at,
    vm.updated_at
FROM personal.variable_measurements vm
CROSS JOIN LATERAL (
    SELECT * FROM BaselineStats 
    WHERE user_id = vm.user_id AND variable_id = vm.variable_id
    ORDER BY reference_phase_id DESC
    LIMIT 1
) bs;

-- Create view for phase comparisons (replacing table)
CREATE OR REPLACE VIEW personal.n1_trial_phase_comparisons AS
WITH PhaseStats AS (
    SELECT 
        tp.id AS phase_id,
        tp.user_id,
        tp.variable_id,
        tp.start_date,
        tp.end_date,
        AVG(vm.value) AS mean_value,
        STDDEV(vm.value) AS stddev_value,
        COUNT(*) as measurement_count
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        vm.user_id = tp.user_id AND 
        vm.variable_id = tp.variable_id AND
        vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, NOW())
    GROUP BY tp.id, tp.user_id, tp.variable_id, tp.start_date, tp.end_date
)
SELECT 
    gen_random_uuid() as id,  -- Generate UUID for each row
    ref.user_id,
    ref.variable_id,
    tp_ref.id as reference_phase_id,
    tp_comp.id as comparison_phase_id,
    (comp.mean_value - ref.mean_value) as mean_difference,
    CASE 
        WHEN ref.mean_value != 0 
        THEN ((comp.mean_value - ref.mean_value) / ABS(ref.mean_value)) * 100 
        ELSE NULL 
    END as percent_change,
    CASE 
        WHEN ref.stddev_value != 0 
        THEN (comp.mean_value - ref.mean_value) / ref.stddev_value
        ELSE NULL 
    END as z_score,
    CASE 
        WHEN (ref.stddev_value + comp.stddev_value) / 2 != 0 
        THEN (comp.mean_value - ref.mean_value) / ((ref.stddev_value + comp.stddev_value) / 2)
        ELSE NULL 
    END as effect_size,
    CASE
        WHEN ABS(comp.mean_value - ref.mean_value) >= 2 * ref.stddev_value THEN true
        ELSE false
    END as is_clinically_significant,
    jsonb_build_object(
        'reference_measurements', ref.measurement_count,
        'comparison_measurements', comp.measurement_count,
        'reference_period', (ref.end_date - ref.start_date),
        'comparison_period', (comp.end_date - comp.start_date)
    ) as clinical_significance_criteria,
    -- Temporal analysis (calculated when possible)
    CASE 
        WHEN comp.start_date > ref.end_date 
        THEN comp.start_date - ref.end_date
        ELSE NULL 
    END as onset_delay,
    NULL::interval as peak_effect_time, -- Would need more detailed analysis
    CASE 
        WHEN comp.end_date IS NOT NULL 
        THEN comp.end_date - comp.start_date
        ELSE NULL 
    END as duration_of_action,
    now() as analysis_timestamp,
    jsonb_build_object(
        'reference_stats', jsonb_build_object('mean', ref.mean_value, 'stddev', ref.stddev_value),
        'comparison_stats', jsonb_build_object('mean', comp.mean_value, 'stddev', comp.stddev_value)
    ) as analysis_parameters,
    NULL::text as notes,
    now() as created_at,
    now() as updated_at
FROM personal.n1_trial_phases tp_ref
JOIN PhaseStats ref ON ref.phase_id = tp_ref.id
JOIN personal.n1_trial_phases tp_comp ON tp_comp.id = tp_ref.comparison_phase_id
JOIN PhaseStats comp ON comp.phase_id = tp_comp.id
WHERE tp_ref.id != tp_comp.id;

-- Create view for analyzing phase effectiveness
CREATE OR REPLACE VIEW personal.n1_trial_phase_effectiveness AS
WITH PhaseStats AS (
    SELECT 
        tp.id AS phase_id,
        tp.user_id,
        tp.variable_id,
        tp.phase_type,
        tp.intervention_variable_id,
        tp.target_dosage,
        tp.adherence_rate,
        tp.effectiveness_rating,
        AVG(vm.value) as avg_value,
        STDDEV(vm.value) as stddev_value,
        COUNT(*) as measurement_count,
        MIN(vm.measurement_time) as first_measurement,
        MAX(vm.measurement_time) as last_measurement
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        vm.user_id = tp.user_id 
        AND vm.variable_id = vm.variable_id
        AND vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, NOW())
    GROUP BY tp.id, tp.user_id, tp.variable_id, tp.phase_type, 
             tp.intervention_variable_id, tp.target_dosage, 
             tp.adherence_rate, tp.effectiveness_rating
)
SELECT 
    ps.*,
    gv.name as variable_name,
    iv.name as intervention_name,
    CASE 
        WHEN cp.avg_value IS NOT NULL THEN 
            ((ps.avg_value - cp.avg_value) / NULLIF(cp.stddev_value, 0))
        ELSE NULL
    END as effect_size,
    CASE
        WHEN ps.phase_type = 'experimental' THEN
            ps.adherence_rate * ps.effectiveness_rating / 100.0
        ELSE NULL
    END as effectiveness_score
FROM PhaseStats ps
JOIN reference.variables gv ON ps.variable_id = gv.id
LEFT JOIN reference.variables iv ON ps.intervention_variable_id = iv.id
LEFT JOIN PhaseStats cp ON cp.id = (
    SELECT tp2.comparison_phase_id 
    FROM personal.n1_trial_phases tp2 
    WHERE tp2.id = ps.phase_id
);

-- Create view for cost effectiveness analysis
CREATE OR REPLACE VIEW personal.n1_trial_intervention_effectiveness AS
SELECT 
    tp.id as phase_id,
    tp.user_id,
    tp.intervention_variable_id,
    gv.name as intervention_name,
    tp.target_dosage,
    tp.cost_per_unit,
    tp.total_cost,
    tp.effectiveness_rating,
    tp.adherence_rate,
    -- Cost effectiveness metrics
    CASE 
        WHEN tp.effectiveness_rating > 0 THEN
            tp.total_cost / tp.effectiveness_rating
        ELSE NULL
    END as cost_per_effectiveness_point,
    CASE 
        WHEN tp.adherence_rate > 0 THEN
            tp.total_cost / (tp.adherence_rate * tp.effectiveness_rating / 100.0)
        ELSE NULL
    END as adjusted_cost_effectiveness
FROM personal.n1_trial_phases tp
JOIN reference.variables gv ON tp.intervention_variable_id = gv.id
WHERE tp.phase_type = 'experimental'
AND tp.total_cost IS NOT NULL
AND tp.effectiveness_rating IS NOT NULL;

-- Add indexes for better query performance
CREATE INDEX idx_n1_trial_phases_user_var 
    ON personal.n1_trial_phases(user_id, variable_id);
CREATE INDEX idx_n1_trial_phases_intervention 
    ON personal.n1_trial_phases(intervention_variable_id) 
    WHERE phase_type = 'experimental';
CREATE INDEX idx_n1_trial_phases_dates 
    ON personal.n1_trial_phases(start_date, end_date);

-- Add helpful comments
COMMENT ON TABLE personal.n1_trial_phases IS 
    'Tracks phases of N-1 trials including interventions, measurements, and analysis. Supports soft deletion via deleted_at.';
COMMENT ON COLUMN personal.n1_trial_phases.intervention_variable_id IS 
    'Reference to the variable being tested/intervened with during experimental phases';
COMMENT ON COLUMN personal.n1_trial_phases.schedule IS 
    'JSON structure for intervention timing: {"frequency": "daily|weekly|etc", "times": ["08:00", "20:00"], "days": ["Mon", "Wed", "Fri"], "duration_minutes": 30}';
COMMENT ON COLUMN personal.n1_trial_phases.prescription_details IS 
    'JSON structure for prescriptions: {"prescriber": "Dr. Name", "pharmacy": "Name", "rx_number": "123", "refills": 3, "prescribed_date": "2024-03-21"}';
COMMENT ON COLUMN personal.n1_trial_phases.side_effects IS 
    'JSON array of reported side effects: [{"effect": "headache", "severity": 1-5, "onset": "2024-03-21", "notes": "mild"}]';
COMMENT ON COLUMN personal.n1_trial_phases.phase_protocol IS 
    'JSON structure defining complete protocol: {"measurement_schedule": {"frequency": "daily", "times": ["08:00"]}, "conditions": {"activity": "fasting", "time_of_day": "morning"}, "instructions": "text"}';

-- Create view for analyzing severity changes
CREATE OR REPLACE VIEW personal.n1_trial_severity_analysis AS
WITH BaselineMeasurements AS (
    SELECT 
        tp.id AS reference_phase_id,
        tp.user_id,
        tp.variable_id,
        tp.start_date,
        tp.end_date,
        AVG(vm.value) AS reference_avg_value,
        STDDEV(vm.value) AS reference_stddev
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        tp.user_id = vm.user_id AND 
        tp.variable_id = vm.variable_id AND
        vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, vm.measurement_time)
    WHERE tp.phase_type IN ('pre_treatment', 'washout', 'stable_period')
    GROUP BY tp.id, tp.user_id, tp.variable_id, tp.start_date, tp.end_date
),
LatestMeasurements AS (
    SELECT DISTINCT ON (user_id, variable_id)
        user_id,
        variable_id,
        value AS latest_value,
        measurement_time AS latest_measurement_time
    FROM personal.variable_measurements
    ORDER BY user_id, variable_id, measurement_time DESC
)
SELECT 
    bm.user_id,
    bm.variable_id,
    gv.name AS variable_name,
    bm.reference_phase_id,
    bm.reference_avg_value,
    bm.reference_stddev,
    lm.latest_value,
    lm.latest_measurement_time,
    (lm.latest_value - bm.reference_avg_value) AS absolute_change,
    CASE 
        WHEN bm.reference_avg_value != 0 
        THEN ((lm.latest_value - bm.reference_avg_value) / ABS(bm.reference_avg_value)) * 100 
        ELSE NULL 
    END AS percent_change,
    CASE
        WHEN (lm.latest_value - bm.reference_avg_value) <= -2 * bm.reference_stddev THEN 'much_improved'
        WHEN (lm.latest_value - bm.reference_avg_value) <= -1 * bm.reference_stddev THEN 'improved'
        WHEN (lm.latest_value - bm.reference_avg_value) BETWEEN -1 * bm.reference_stddev AND bm.reference_stddev THEN 'no_change'
        WHEN (lm.latest_value - bm.reference_avg_value) >= 2 * bm.reference_stddev THEN 'much_worsened'
        WHEN (lm.latest_value - bm.reference_avg_value) >= bm.reference_stddev THEN 'worsened'
    END AS calculated_severity_change
FROM BaselineMeasurements bm
JOIN reference.variables gv ON bm.variable_id = gv.id
LEFT JOIN LatestMeasurements lm ON bm.user_id = lm.user_id AND bm.variable_id = lm.variable_id;

-- Add RLS policies
ALTER TABLE personal.n1_trial_phases ENABLE ROW LEVEL SECURITY;

-- Users can view their own trial phases
CREATE POLICY "Users can view their own trial phases"
    ON personal.n1_trial_phases FOR SELECT
    USING (auth.uid() = user_id);

-- Users can manage their own trial phases
CREATE POLICY "Users can manage their own trial phases"
    ON personal.n1_trial_phases FOR ALL
    USING (auth.uid() = user_id);

-- Add indexes to support view performance
CREATE INDEX IF NOT EXISTS idx_variable_measurements_user_var_time 
    ON personal.variable_measurements(user_id, variable_id, measurement_time);
CREATE INDEX IF NOT EXISTS idx_variable_measurements_time_range 
    ON personal.variable_measurements(measurement_time);

-- Document views
COMMENT ON VIEW personal.n1_trial_severity_changes IS 
    'Real-time calculation of severity changes for each measurement compared to baseline periods in N-1 trials. Uses standard deviations to determine clinical significance.';
COMMENT ON VIEW personal.n1_trial_phase_comparisons IS 
    'Statistical comparison between N-1 trial phases, including effect sizes, temporal analysis, and clinical significance metrics.';
COMMENT ON VIEW personal.n1_trial_phase_effectiveness IS 
    'Analysis of N-1 trial phase effectiveness combining measurement statistics with adherence and effectiveness ratings.';
COMMENT ON VIEW personal.n1_trial_intervention_effectiveness IS 
    'Cost-benefit analysis for experimental phases in N-1 trials, calculating both raw and adherence-adjusted cost effectiveness.';
COMMENT ON VIEW personal.n1_trial_severity_analysis IS 
    'Longitudinal analysis comparing latest measurements to baseline periods to track N-1 trial progression.';

-- Document key columns
COMMENT ON COLUMN personal.n1_trial_severity_changes.severity_change IS 
    'Categorization based on standard deviations: much_improved (<-2σ), improved (<-1σ), no_change (±1σ), worsened (>1σ), much_worsened (>2σ)';
COMMENT ON COLUMN personal.n1_trial_phase_comparisons.effect_size IS 
    'Cohen''s d calculation using pooled standard deviation between phases';
COMMENT ON COLUMN personal.n1_trial_phase_comparisons.z_score IS 
    'Standardized score using reference phase''s standard deviation';
COMMENT ON COLUMN personal.n1_trial_phase_effectiveness.effectiveness_score IS 
    'Combined score (0-5) factoring in both adherence rate and effectiveness rating';
COMMENT ON COLUMN personal.n1_trial_intervention_effectiveness.adjusted_cost_effectiveness IS 
    'Cost per effectiveness point adjusted for adherence rate to reflect real-world effectiveness'; 