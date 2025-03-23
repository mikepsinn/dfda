-- Create tables for trial phase tracking and change analysis
CREATE TABLE IF NOT EXISTS medical.trial_phases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    variable_id uuid NOT NULL REFERENCES medical_ref.global_variables(id) ON DELETE CASCADE,
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
    comparison_phase_id uuid REFERENCES medical.trial_phases(id), -- For explicit phase comparisons
    
    -- Intervention details (for experimental phases)
    intervention_variable_id uuid REFERENCES medical_ref.global_variables(id), -- What's being tested
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
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > start_date),
    -- Ensure intervention details for experimental phases
    CONSTRAINT intervention_required CHECK (
        (phase_type = 'experimental' AND intervention_variable_id IS NOT NULL) OR
        (phase_type != 'experimental' AND intervention_variable_id IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS medical.severity_changes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    variable_id uuid NOT NULL REFERENCES medical_ref.global_variables(id) ON DELETE CASCADE,
    reference_phase_id uuid REFERENCES medical.trial_phases(id) ON DELETE CASCADE,
    measurement_time timestamptz NOT NULL,
    reference_value decimal,
    current_value decimal,
    unit_id uuid REFERENCES medical_ref.units_of_measurement(id) ON DELETE RESTRICT,
    absolute_change decimal,
    percent_change decimal,
    severity_change text CHECK (severity_change IN ('much_improved', 'improved', 'no_change', 'worsened', 'much_worsened')),
    is_clinically_significant boolean,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Phase Comparisons for detailed analysis
CREATE TABLE IF NOT EXISTS medical.phase_comparisons (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    variable_id uuid NOT NULL REFERENCES medical_ref.global_variables(id) ON DELETE CASCADE,
    reference_phase_id uuid NOT NULL REFERENCES medical.trial_phases(id) ON DELETE CASCADE,
    comparison_phase_id uuid NOT NULL REFERENCES medical.trial_phases(id) ON DELETE CASCADE,
    -- Statistical measures
    mean_difference decimal,
    percent_change decimal,
    z_score decimal,
    effect_size decimal, -- Cohen's d
    -- Clinical significance
    is_clinically_significant boolean,
    clinical_significance_criteria jsonb,
    -- Temporal analysis
    onset_delay interval,
    peak_effect_time interval,
    duration_of_action interval,
    -- Analysis metadata
    analysis_timestamp timestamptz DEFAULT now(),
    analysis_parameters jsonb,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT different_phases CHECK (reference_phase_id != comparison_phase_id)
);

-- Create view for analyzing phase effectiveness
CREATE OR REPLACE VIEW medical.phase_effectiveness AS
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
    FROM medical.trial_phases tp
    JOIN medical.variable_measurements vm ON 
        vm.user_id = tp.user_id 
        AND vm.variable_id = tp.variable_id
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
JOIN medical_ref.global_variables gv ON ps.variable_id = gv.id
LEFT JOIN medical_ref.global_variables iv ON ps.intervention_variable_id = iv.id
LEFT JOIN PhaseStats cp ON cp.id = (
    SELECT tp2.comparison_phase_id 
    FROM medical.trial_phases tp2 
    WHERE tp2.id = ps.phase_id
);

-- Create view for cost effectiveness analysis
CREATE OR REPLACE VIEW medical.intervention_cost_effectiveness AS
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
FROM medical.trial_phases tp
JOIN medical_ref.global_variables gv ON tp.intervention_variable_id = gv.id
WHERE tp.phase_type = 'experimental'
AND tp.total_cost IS NOT NULL
AND tp.effectiveness_rating IS NOT NULL;

-- Add indexes for better query performance
CREATE INDEX idx_trial_phases_user_var 
    ON medical.trial_phases(user_id, variable_id);
CREATE INDEX idx_trial_phases_intervention 
    ON medical.trial_phases(intervention_variable_id) 
    WHERE phase_type = 'experimental';
CREATE INDEX idx_trial_phases_dates 
    ON medical.trial_phases(start_date, end_date);

-- Add helpful comments
COMMENT ON TABLE medical.trial_phases IS 
    'Comprehensive tracking of trial phases including interventions, measurements, and analysis';
COMMENT ON COLUMN medical.trial_phases.intervention_variable_id IS 
    'Reference to the variable being tested/intervened with during experimental phases';
COMMENT ON COLUMN medical.trial_phases.schedule IS 
    'Detailed protocol schedule including timing, frequency, and measurement requirements';
COMMENT ON COLUMN medical.trial_phases.phase_protocol IS 
    'Complete protocol definition including measurement schedule and intervention details';

-- Create view for analyzing severity changes
CREATE OR REPLACE VIEW medical.severity_analysis AS
WITH BaselineMeasurements AS (
    SELECT 
        tp.id AS reference_phase_id,
        tp.user_id,
        tp.variable_id,
        tp.start_date,
        tp.end_date,
        AVG(vm.value) AS reference_avg_value,
        STDDEV(vm.value) AS reference_stddev
    FROM medical.trial_phases tp
    JOIN medical.variable_measurements vm ON 
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
    FROM medical.variable_measurements
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
JOIN medical_ref.global_variables gv ON bm.variable_id = gv.id
LEFT JOIN LatestMeasurements lm ON bm.user_id = lm.user_id AND bm.variable_id = lm.variable_id;

-- Add RLS policies
ALTER TABLE medical.trial_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical.severity_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical.phase_comparisons ENABLE ROW LEVEL SECURITY;

-- Users can view their own trial phases
CREATE POLICY "Users can view their own trial phases"
    ON medical.trial_phases FOR SELECT
    USING (auth.uid() = user_id);

-- Users can manage their own trial phases
CREATE POLICY "Users can manage their own trial phases"
    ON medical.trial_phases FOR ALL
    USING (auth.uid() = user_id);

-- Users can view their own severity changes
CREATE POLICY "Users can view their own severity changes"
    ON medical.severity_changes FOR SELECT
    USING (auth.uid() = user_id);

-- Users can manage their own severity changes
CREATE POLICY "Users can manage their own severity changes"
    ON medical.severity_changes FOR ALL
    USING (auth.uid() = user_id);

-- Users can view their own phase comparisons
CREATE POLICY "Users can view their own phase comparisons"
    ON medical.phase_comparisons FOR SELECT
    USING (auth.uid() = user_id);

-- Users can manage their own phase comparisons
CREATE POLICY "Users can manage their own phase comparisons"
    ON medical.phase_comparisons FOR ALL
    USING (auth.uid() = user_id);

-- Function to calculate severity changes
CREATE OR REPLACE FUNCTION medical.calculate_severity_changes(
    p_user_id uuid,
    p_variable_id uuid,
    p_reference_phase_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    reference_avg decimal;
    reference_stddev decimal;
BEGIN
    -- Calculate reference statistics
    SELECT 
        AVG(value),
        STDDEV(value)
    INTO 
        reference_avg,
        reference_stddev
    FROM medical.variable_measurements vm
    JOIN medical.trial_phases tp ON 
        vm.user_id = tp.user_id AND 
        vm.variable_id = tp.variable_id
    WHERE 
        tp.id = p_reference_phase_id AND
        vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, vm.measurement_time);

    -- Insert or update severity changes
    INSERT INTO medical.severity_changes (
        user_id,
        variable_id,
        reference_phase_id,
        measurement_time,
        reference_value,
        current_value,
        unit_id,
        absolute_change,
        percent_change,
        severity_change,
        is_clinically_significant
    )
    SELECT
        vm.user_id,
        vm.variable_id,
        p_reference_phase_id,
        vm.measurement_time,
        reference_avg,
        vm.value,
        vm.unit_id,
        (vm.value - reference_avg) AS absolute_change,
        CASE 
            WHEN reference_avg != 0 
            THEN ((vm.value - reference_avg) / ABS(reference_avg)) * 100 
            ELSE NULL 
        END AS percent_change,
        CASE
            WHEN (vm.value - reference_avg) <= -2 * reference_stddev THEN 'much_improved'
            WHEN (vm.value - reference_avg) <= -1 * reference_stddev THEN 'improved'
            WHEN (vm.value - reference_avg) BETWEEN -1 * reference_stddev AND reference_stddev THEN 'no_change'
            WHEN (vm.value - reference_avg) >= 2 * reference_stddev THEN 'much_worsened'
            WHEN (vm.value - reference_avg) >= reference_stddev THEN 'worsened'
        END AS severity_change,
        CASE
            WHEN ABS(vm.value - reference_avg) >= 2 * reference_stddev THEN true
            ELSE false
        END AS is_clinically_significant
    FROM medical.variable_measurements vm
    WHERE 
        vm.user_id = p_user_id AND 
        vm.variable_id = p_variable_id
    ON CONFLICT (id) DO UPDATE
    SET 
        reference_value = EXCLUDED.reference_value,
        absolute_change = EXCLUDED.absolute_change,
        percent_change = EXCLUDED.percent_change,
        severity_change = EXCLUDED.severity_change,
        is_clinically_significant = EXCLUDED.is_clinically_significant,
        updated_at = now();
END;
$$;

-- Function to analyze phase comparisons
CREATE OR REPLACE FUNCTION medical.analyze_phase_comparison(
    p_reference_phase_id uuid,
    p_comparison_phase_id uuid,
    p_analysis_params jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id uuid;
    v_variable_id uuid;
    v_reference_mean decimal;
    v_reference_stddev decimal;
    v_comparison_mean decimal;
    v_comparison_stddev decimal;
BEGIN
    -- Get phase information
    SELECT user_id, variable_id INTO v_user_id, v_variable_id
    FROM medical.trial_phases
    WHERE id = p_reference_phase_id;

    -- Calculate reference phase statistics
    SELECT 
        AVG(value),
        STDDEV(value)
    INTO 
        v_reference_mean,
        v_reference_stddev
    FROM medical.variable_measurements
    WHERE user_id = v_user_id
    AND variable_id = v_variable_id
    AND measurement_time BETWEEN 
        (SELECT start_date FROM medical.trial_phases WHERE id = p_reference_phase_id)
        AND COALESCE(
            (SELECT end_date FROM medical.trial_phases WHERE id = p_reference_phase_id),
            NOW()
        );

    -- Calculate comparison phase statistics
    SELECT 
        AVG(value),
        STDDEV(value)
    INTO 
        v_comparison_mean,
        v_comparison_stddev
    FROM medical.variable_measurements
    WHERE user_id = v_user_id
    AND variable_id = v_variable_id
    AND measurement_time BETWEEN 
        (SELECT start_date FROM medical.trial_phases WHERE id = p_comparison_phase_id)
        AND COALESCE(
            (SELECT end_date FROM medical.trial_phases WHERE id = p_comparison_phase_id),
            NOW()
        );

    -- Insert or update comparison analysis
    INSERT INTO medical.phase_comparisons (
        user_id,
        variable_id,
        reference_phase_id,
        comparison_phase_id,
        mean_difference,
        percent_change,
        z_score,
        effect_size,
        is_clinically_significant,
        analysis_parameters
    )
    VALUES (
        v_user_id,
        v_variable_id,
        p_reference_phase_id,
        p_comparison_phase_id,
        (v_comparison_mean - v_reference_mean),
        CASE 
            WHEN v_reference_mean != 0 
            THEN ((v_comparison_mean - v_reference_mean) / ABS(v_reference_mean)) * 100 
            ELSE NULL 
        END,
        CASE 
            WHEN v_reference_stddev != 0 
            THEN (v_comparison_mean - v_reference_mean) / v_reference_stddev
            ELSE NULL 
        END,
        CASE 
            WHEN (v_reference_stddev + v_comparison_stddev) / 2 != 0 
            THEN (v_comparison_mean - v_reference_mean) / ((v_reference_stddev + v_comparison_stddev) / 2)
            ELSE NULL 
        END,
        CASE
            WHEN ABS(v_comparison_mean - v_reference_mean) >= 2 * v_reference_stddev THEN true
            ELSE false
        END,
        p_analysis_params
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        mean_difference = EXCLUDED.mean_difference,
        percent_change = EXCLUDED.percent_change,
        z_score = EXCLUDED.z_score,
        effect_size = EXCLUDED.effect_size,
        is_clinically_significant = EXCLUDED.is_clinically_significant,
        analysis_parameters = EXCLUDED.analysis_parameters,
        analysis_timestamp = now(),
        updated_at = now();
END;
$$; 