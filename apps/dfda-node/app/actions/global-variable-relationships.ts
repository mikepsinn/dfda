'use server';

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Database } from "@/lib/database.types";
import type { OutcomeCategory, OutcomeItem, OutcomeValue, FooterMetadata, OutcomeLabelProps } from "@/components/OutcomeLabel";
import { logger } from "@/lib/logger";

// Type definitions copied from page.tsx
type FetchedRelationship = Database['public']['Tables']['global_variable_relationships']['Row'] & {
  outcome_variable: Pick<Database['public']['Tables']['global_variables']['Row'], 'id' | 'name'>;
  absolute_change_unit: Pick<Database['public']['Tables']['units']['Row'], 'id' | 'abbreviated_name'> | null;
  citation: Partial<Database['public']['Tables']['citations']['Row']> | null;
};
type FetchedPredictor = Pick<Database['public']['Tables']['global_variables']['Row'], 'id' | 'name' | 'description'> & {
  variable_category: Pick<Database['public']['Tables']['variable_categories']['Row'], 'name'> | null;
};
// Define the structure returned by the action (matching OutcomeLabelProps)
export type OutcomeLabelData = Omit<OutcomeLabelProps, 'data'> & {
    data: OutcomeCategory[];
};

/**
 * Fetches and processes data required for the OutcomeLabel component for a given predictor ID.
 */
export async function getOutcomeLabelDataAction(predictorId: string): Promise<OutcomeLabelData> {
    logger.info("Fetching outcome label data", { predictorId });
    const supabase = await createClient();

    // 1. Fetch Predictor Details
    const { data: predictorData, error: predictorError } = await supabase
        .from('global_variables')
        .select('id, name, description, variable_category:variable_categories(name)')
        .eq('id', predictorId)
        .single<FetchedPredictor>();

    if (predictorError || !predictorData) {
        logger.error('Error fetching predictor', { predictorId, error: predictorError?.message });
        notFound(); // Trigger 404 if predictor doesn't exist
    }

    // 2. Fetch Relationship Data
    const selectQuery = '*, outcome_variable:global_variables!outcome_global_variable_id(id, name), absolute_change_unit:units(id, abbreviated_name), citation:citations!left(*)';
    const { data: relationships, error: relationshipsError } = await supabase
        .from('global_variable_relationships')
        .select(selectQuery)
        .eq('predictor_global_variable_id', predictorId);

    if (relationshipsError) {
        logger.error("Error fetching relationships", { predictorId, error: relationshipsError.message });
        // Continue, but data might be incomplete
    }

    // 3. Process data into OutcomeLabelProps format
    const outcomeLabelProps: OutcomeLabelData = {
        title: predictorData.name,
        subtitle: predictorData.description ?? undefined,
        tag: predictorData.variable_category?.name ?? undefined,
        data: [],
        footer: undefined,
    };

    if (!relationships || relationships.length === 0) {
        logger.warn("No outcome relationships found for predictor", { predictorId });
        return outcomeLabelProps; // Return with empty data if no relationships
    }

    const categories: { [key: string]: OutcomeCategory } = {};
    let firstCitationData: FetchedRelationship['citation'] | null = null;
    let latestUpdate: string | null = null;
    let hasNNH = false;

    (relationships as FetchedRelationship[]).forEach((rel) => {
        if (!rel.outcome_variable || !rel.citation) {
            logger.warn("Skipping relationship due to missing joined data", { relationshipId: rel.id });
            return;
        }

        const categoryTitle = rel.category || 'Uncategorized';
        if (!categories[categoryTitle]) {
            categories[categoryTitle] = {
                title: categoryTitle,
                items: [],
                isSideEffectCategory: categoryTitle.toLowerCase().includes('side effect'),
            };
        }

        let absoluteString: string | undefined = undefined;
        if (rel.absolute_change_value !== null && rel.absolute_change_unit?.abbreviated_name) {
            const sign = rel.absolute_change_value > 0 ? '+' : '';
            absoluteString = `${sign}${rel.absolute_change_value} ${rel.absolute_change_unit.abbreviated_name}`;
        } else if (rel.absolute_change_value !== null) {
            const sign = rel.absolute_change_value > 0 ? '+' : '';
            absoluteString = `${sign}${rel.absolute_change_value}`;
        }

        const outcomeValue: OutcomeValue = {
            percentage: rel.percentage_change ?? 0,
            absolute: absoluteString,
            nnh: rel.nnh ?? undefined,
        };

        const outcomeItem: OutcomeItem = {
            name: rel.outcome_variable.name,
            baseline: rel.baseline_description ?? undefined,
            value: outcomeValue,
            isPositive: rel.is_positive_outcome === null ? undefined : rel.is_positive_outcome,
        };

        categories[categoryTitle].items.push(outcomeItem);

        if (!firstCitationData && rel.citation) {
            firstCitationData = rel.citation;
        }
        if (rel.data_last_updated) {
            if (!latestUpdate || new Date(rel.data_last_updated) > new Date(latestUpdate)) {
                latestUpdate = rel.data_last_updated;
            }
        }
        if (rel.nnh !== null) {
            hasNNH = true;
        }
    });

    // Sort categories alphabetically by title now, as DB order is removed
    outcomeLabelProps.data = Object.values(categories).sort((a, b) => a.title.localeCompare(b.title));

    if (firstCitationData) {
        outcomeLabelProps.footer = {
            sourceDescription: `Data based on: ${firstCitationData.title || firstCitationData.journal_or_publisher || 'Source'} (${firstCitationData.publication_year || 'N/A'})`,
            lastUpdated: latestUpdate ? `Last updated: ${new Date(latestUpdate).toLocaleDateString()}` : 'Update info N/A',
            nnhDescription: hasNNH ? "NNH = Number Needed to Harm" : undefined,
        };
    }

    logger.info("Successfully fetched and processed outcome label data", { predictorId });
    return outcomeLabelProps;
}

// Add other actions related to global_variable_relationships if needed 