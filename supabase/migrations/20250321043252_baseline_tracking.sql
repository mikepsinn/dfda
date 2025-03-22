-- Create tables for baseline tracking and change analysis
CREATE TABLE IF NOT EXISTS medical.baseline_periods (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    variable_id uuid NOT NULL REFERENCES medical_ref.global_variables(id) ON DELETE CASCADE,
    start_date timestamptz NOT NULL,
    end_date timestamptz,
    baseline_type text NOT NULL CHECK (baseline_type IN ('pre_treatment', 'washout', 'stable_period')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > start_date)
);

CREATE TABLE IF NOT EXISTS medical.severity_changes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    variable_id uuid NOT NULL REFERENCES medical_ref.global_variables(id) ON DELETE CASCADE,
    baseline_period_id uuid REFERENCES medical.baseline_periods(id) ON DELETE CASCADE,
    measurement_time timestamptz NOT NULL,
    baseline_value decimal,
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

-- Create view for analyzing severity changes
CREATE OR REPLACE VIEW medical.severity_analysis AS
WITH BaselineMeasurements AS (
    SELECT 
        bp.id AS baseline_period_id,
        bp.user_id,
        bp.variable_id,
        bp.start_date,
        bp.end_date,
        AVG(vm.value) AS baseline_avg_value,
        STDDEV(vm.value) AS baseline_stddev
    FROM medical.baseline_periods bp
    JOIN medical.variable_measurements vm ON 
        bp.user_id = vm.user_id AND 
        bp.variable_id = vm.variable_id AND
        vm.measurement_time BETWEEN bp.start_date AND COALESCE(bp.end_date, vm.measurement_time)
    GROUP BY bp.id, bp.user_id, bp.variable_id, bp.start_date, bp.end_date
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
    bm.baseline_period_id,
    bm.baseline_avg_value,
    bm.baseline_stddev,
    lm.latest_value,
    lm.latest_measurement_time,
    (lm.latest_value - bm.baseline_avg_value) AS absolute_change,
    CASE 
        WHEN bm.baseline_avg_value != 0 
        THEN ((lm.latest_value - bm.baseline_avg_value) / ABS(bm.baseline_avg_value)) * 100 
        ELSE NULL 
    END AS percent_change,
    CASE
        WHEN (lm.latest_value - bm.baseline_avg_value) <= -2 * bm.baseline_stddev THEN 'much_improved'
        WHEN (lm.latest_value - bm.baseline_avg_value) <= -1 * bm.baseline_stddev THEN 'improved'
        WHEN (lm.latest_value - bm.baseline_avg_value) BETWEEN -1 * bm.baseline_stddev AND bm.baseline_stddev THEN 'no_change'
        WHEN (lm.latest_value - bm.baseline_avg_value) >= 2 * bm.baseline_stddev THEN 'much_worsened'
        WHEN (lm.latest_value - bm.baseline_avg_value) >= bm.baseline_stddev THEN 'worsened'
    END AS calculated_severity_change
FROM BaselineMeasurements bm
JOIN medical_ref.global_variables gv ON bm.variable_id = gv.id
LEFT JOIN LatestMeasurements lm ON bm.user_id = lm.user_id AND bm.variable_id = lm.variable_id;

-- Add RLS policies
ALTER TABLE medical.baseline_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical.severity_changes ENABLE ROW LEVEL SECURITY;

-- Users can view their own baseline periods
CREATE POLICY "Users can view their own baseline periods"
    ON medical.baseline_periods FOR SELECT
    USING (auth.uid() = user_id);

-- Users can manage their own baseline periods
CREATE POLICY "Users can manage their own baseline periods"
    ON medical.baseline_periods FOR ALL
    USING (auth.uid() = user_id);

-- Users can view their own severity changes
CREATE POLICY "Users can view their own severity changes"
    ON medical.severity_changes FOR SELECT
    USING (auth.uid() = user_id);

-- Users can manage their own severity changes
CREATE POLICY "Users can manage their own severity changes"
    ON medical.severity_changes FOR ALL
    USING (auth.uid() = user_id);

-- Function to calculate severity changes
CREATE OR REPLACE FUNCTION medical.calculate_severity_changes(
    p_user_id uuid,
    p_variable_id uuid,
    p_baseline_period_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    baseline_avg decimal;
    baseline_stddev decimal;
BEGIN
    -- Calculate baseline statistics
    SELECT 
        AVG(value),
        STDDEV(value)
    INTO 
        baseline_avg,
        baseline_stddev
    FROM medical.variable_measurements vm
    JOIN medical.baseline_periods bp ON 
        vm.user_id = bp.user_id AND 
        vm.variable_id = bp.variable_id
    WHERE 
        bp.id = p_baseline_period_id AND
        vm.measurement_time BETWEEN bp.start_date AND COALESCE(bp.end_date, vm.measurement_time);

    -- Insert or update severity changes
    INSERT INTO medical.severity_changes (
        user_id,
        variable_id,
        baseline_period_id,
        measurement_time,
        baseline_value,
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
        p_baseline_period_id,
        vm.measurement_time,
        baseline_avg,
        vm.value,
        vm.unit_id,
        (vm.value - baseline_avg) AS absolute_change,
        CASE 
            WHEN baseline_avg != 0 
            THEN ((vm.value - baseline_avg) / ABS(baseline_avg)) * 100 
            ELSE NULL 
        END AS percent_change,
        CASE
            WHEN (vm.value - baseline_avg) <= -2 * baseline_stddev THEN 'much_improved'
            WHEN (vm.value - baseline_avg) <= -1 * baseline_stddev THEN 'improved'
            WHEN (vm.value - baseline_avg) BETWEEN -1 * baseline_stddev AND baseline_stddev THEN 'no_change'
            WHEN (vm.value - baseline_avg) >= 2 * baseline_stddev THEN 'much_worsened'
            WHEN (vm.value - baseline_avg) >= baseline_stddev THEN 'worsened'
        END AS severity_change,
        CASE
            WHEN ABS(vm.value - baseline_avg) >= 2 * baseline_stddev THEN true
            ELSE false
        END AS is_clinically_significant
    FROM medical.variable_measurements vm
    WHERE 
        vm.user_id = p_user_id AND 
        vm.variable_id = p_variable_id
    ON CONFLICT (id) DO UPDATE
    SET 
        baseline_value = EXCLUDED.baseline_value,
        absolute_change = EXCLUDED.absolute_change,
        percent_change = EXCLUDED.percent_change,
        severity_change = EXCLUDED.severity_change,
        is_clinically_significant = EXCLUDED.is_clinically_significant,
        updated_at = now();
END;
$$; 