'use server';

import { getUserDb } from "@/lib/db/server";
import { notFound } from "next/navigation";
import { Database } from "@/lib/database.types";
import type { OutcomeCategory, OutcomeItem, OutcomeValue, OutcomeLabelProps } from "@/components/OutcomeLabel";
import { logger } from "@/lib/logger";

// Define the full citation type for clarity
type FullCitation = Database['public']['Tables']['citations']['Row'];

// Type definitions
type FetchedPredictor = Pick<Database['public']['Tables']['global_variables']['Row'], 'id' | 'name' | 'description'> & {
  variable_categories: Pick<Database['public']['Tables']['variable_categories']['Row'], 'name'>;
};

// Define a new Footer type that includes the full citation
export interface OutcomeFooterData {
    sourceCitation?: FullCitation | null; // Pass the whole object
    lastUpdated?: string;
    nnhDescription?: string;
}

// Update the return type to use the new footer structure
export type OutcomeLabelData = Omit<OutcomeLabelProps, 'data' | 'footer'> & {
    data: OutcomeCategory[];
    footer?: OutcomeFooterData; // Footer is now of the new type
};

/**
 * Fetches and processes data required for the OutcomeLabel component for a given predictor ID.
 */
export async function getOutcomeLabelDataAction(predictorId: string): Promise<OutcomeLabelData> {
    logger.info("Fetching outcome label data", { predictorId });
    const db = await getUserDb();

    // 1. Fetch Predictor Details
    let predictorData: FetchedPredictor | null = null;
    let predictorError: unknown = null;
    try {
        predictorData = await db.global_variables.findUnique({
            where: { id: predictorId },
            select: { id: true, name: true, description: true, variable_categories: { select: { name: true } } },
        });
    } catch (error) {
        predictorError = error;
    }

    if (!predictorData) {
        logger.error('Error fetching predictor', { predictorId, error: predictorError instanceof Error ? predictorError.message : undefined });
        notFound();
    }

    // 2. Fetch Relationship Data with full citation
    const relationships = await db.global_variable_relationships
        .findMany({
            where: { predictor_global_variable_id: predictorId },
            include: {
                outcome_variable: { select: { id: true, name: true } },
                units: { select: { id: true, abbreviated_name: true } },
                citations: true, // Fetch all citation fields
            },
        })
        .catch((relationshipsError: unknown) => {
            logger.error("Error fetching relationships", { predictorId, error: relationshipsError instanceof Error ? relationshipsError.message : relationshipsError });
            // Continue, but data might be incomplete
            return [];
        });

    // 3. Process data into OutcomeLabelProps format
    const outcomeLabelProps: OutcomeLabelData = {
        title: predictorData.name,
        subtitle: predictorData.description ?? undefined,
        tag: predictorData.variable_categories.name,
        data: [],
        footer: undefined,
    };

    if (relationships.length === 0) {
        logger.warn("No outcome relationships found for predictor", { predictorId });
        return outcomeLabelProps;
    }

    const categories: { [key: string]: OutcomeCategory } = {};
    let firstCitationData: FullCitation | null = null; // Use the full citation type
    let latestUpdate: Date | null = null;
    let hasNNH = false;

    for (const rel of relationships) {
        if (!rel.outcome_variable || !rel.citations) {
            logger.warn("Skipping relationship due to missing joined data", { relationshipId: rel.id });
            continue;
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
        if (rel.absolute_change_value !== null && rel.units?.abbreviated_name) {
            const sign = rel.absolute_change_value > 0 ? '+' : '';
            absoluteString = `${sign}${rel.absolute_change_value} ${rel.units.abbreviated_name}`;
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

        if (!firstCitationData && rel.citations) {
            // No assertion needed now as types should align if query is correct
            firstCitationData = rel.citations;
        }
        if (rel.data_last_updated) {
            if (!latestUpdate || rel.data_last_updated > latestUpdate) {
                latestUpdate = rel.data_last_updated;
            }
        }
        if (rel.nnh !== null) {
            hasNNH = true;
        }
    }

    // Sort categories alphabetically
    outcomeLabelProps.data = Object.values(categories).sort((a, b) => a.title.localeCompare(b.title));

    // Update footer assignment
    if (firstCitationData || latestUpdate || hasNNH) {
        outcomeLabelProps.footer = {
            sourceCitation: firstCitationData, // Pass the full object
            lastUpdated: latestUpdate ? `Last updated: ${latestUpdate.toLocaleDateString()}` : undefined,
            nnhDescription: hasNNH ? "NNH = Number Needed to Harm" : undefined,
        };
    }

    logger.info("Successfully fetched and processed outcome label data", { predictorId });
    return outcomeLabelProps;
}

// Add other actions related to global_variable_relationships if needed 