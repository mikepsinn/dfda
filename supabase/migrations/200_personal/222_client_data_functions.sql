-- Function to process client data
CREATE OR REPLACE FUNCTION personal.process_client_data(
    p_client_id text,
    p_user_id uuid,
    p_data jsonb,
    p_source_type text DEFAULT 'client_data'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_source_id uuid;
    v_result jsonb;
    v_measurements_count integer := 0;
    v_conditions_count integer := 0;
    v_medications_count integer := 0;
    v_lab_results_count integer := 0;
BEGIN
    -- Get or create data source
    INSERT INTO reference.data_sources (
        source_type,
        client_id,
        name,
        description,
        metadata
    )
    VALUES (
        p_source_type,
        p_client_id,
        'Client: ' || p_client_id,
        'Data from client ' || p_client_id,
        p_data->'metadata'
    )
    ON CONFLICT (client_id) WHERE source_type = p_source_type
    DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP,
        metadata = EXCLUDED.metadata
    RETURNING id INTO v_source_id;

    -- Process measurements
    IF p_data ? 'measurements' AND jsonb_typeof(p_data->'measurements') = 'array' THEN
        INSERT INTO personal.variable_measurements (
            user_id,
            variable_id,
            value,
            unit_id,
            measurement_time,
            source,
            source_id,
            notes,
            is_estimated,
            metadata
        )
        SELECT
            p_user_id,
            (m->>'variable_id')::uuid,
            (m->>'value')::numeric,
            (m->>'unit_id')::uuid,
            COALESCE(
                (m->>'measurement_time')::timestamp with time zone,
                CURRENT_TIMESTAMP
            ),
            p_source_type,
            v_source_id,
            m->>'notes',
            COALESCE((m->>'is_estimated')::boolean, false),
            m->'metadata'
        FROM jsonb_array_elements(p_data->'measurements') m
        WHERE m->>'variable_id' IS NOT NULL
        AND m->>'value' IS NOT NULL
        AND m->>'unit_id' IS NOT NULL;

        GET DIAGNOSTICS v_measurements_count = ROW_COUNT;
    END IF;

    -- Process conditions
    IF p_data ? 'conditions' AND jsonb_typeof(p_data->'conditions') = 'array' THEN
        INSERT INTO personal.conditions (
            user_id,
            variable_id,
            onset_date,
            resolution_date,
            status,
            diagnosis_type,
            notes,
            metadata
        )
        SELECT
            p_user_id,
            (c->>'variable_id')::uuid,
            COALESCE(
                (c->>'onset_date')::timestamp with time zone,
                CURRENT_TIMESTAMP
            ),
            (c->>'resolution_date')::timestamp with time zone,
            COALESCE(c->>'status', 'active'),
            COALESCE(c->>'diagnosis_type', 'self_reported'),
            c->>'notes',
            c->'metadata'
        FROM jsonb_array_elements(p_data->'conditions') c
        WHERE c->>'variable_id' IS NOT NULL;

        GET DIAGNOSTICS v_conditions_count = ROW_COUNT;
    END IF;

    -- Process medications
    IF p_data ? 'medications' AND jsonb_typeof(p_data->'medications') = 'array' THEN
        INSERT INTO personal.medications (
            user_id,
            variable_id,
            dosage,
            unit_id,
            start_date,
            end_date,
            status,
            notes,
            metadata
        )
        SELECT
            p_user_id,
            (m->>'variable_id')::uuid,
            (m->>'dosage')::numeric,
            (m->>'unit_id')::uuid,
            COALESCE(
                (m->>'start_date')::timestamp with time zone,
                CURRENT_TIMESTAMP
            ),
            (m->>'end_date')::timestamp with time zone,
            COALESCE(m->>'status', 'active'),
            m->>'notes',
            m->'metadata'
        FROM jsonb_array_elements(p_data->'medications') m
        WHERE m->>'variable_id' IS NOT NULL;

        GET DIAGNOSTICS v_medications_count = ROW_COUNT;
    END IF;

    -- Process lab results
    IF p_data ? 'lab_results' AND jsonb_typeof(p_data->'lab_results') = 'array' THEN
        INSERT INTO personal.lab_results (
            user_id,
            lab_test_id,
            value,
            unit_id,
            test_date,
            notes,
            metadata
        )
        SELECT
            p_user_id,
            (l->>'lab_test_id')::uuid,
            (l->>'value')::numeric,
            (l->>'unit_id')::uuid,
            COALESCE(
                (l->>'test_date')::timestamp with time zone,
                CURRENT_TIMESTAMP
            ),
            l->>'notes',
            l->'metadata'
        FROM jsonb_array_elements(p_data->'lab_results') l
        WHERE l->>'lab_test_id' IS NOT NULL
        AND l->>'value' IS NOT NULL
        AND l->>'unit_id' IS NOT NULL;

        GET DIAGNOSTICS v_lab_results_count = ROW_COUNT;
    END IF;

    -- Build result
    v_result := jsonb_build_object(
        'source_id', v_source_id,
        'measurements_count', v_measurements_count,
        'conditions_count', v_conditions_count,
        'medications_count', v_medications_count,
        'lab_results_count', v_lab_results_count
    );

    RETURN v_result;
END;
$$; 