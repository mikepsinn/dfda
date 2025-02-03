import { z } from "zod";
import { generateObject } from "ai";
import { getModelByName } from "./modelUtils";

const SearchQueriesSchema = z.object({
    queries: z.array(z.string())
        .describe("An array of search queries, each optimized for research effectiveness")
});

export async function generateSearchQueries(topic: string, n: number): Promise<string[]> {
    if(n < 2) {
       return [topic];
    }

    const userPrompt = 
        `Generate ${n} search queries for researching: ${topic}. 
        Each query should be optimized for finding high-quality, relevant information.
        Vary the queries to cover different aspects and phrasings of the topic.
        Include both broad and specific queries to ensure comprehensive coverage.`;

    const result = await generateObject({
        model: getModelByName(),
        schema: SearchQueriesSchema,
        prompt: userPrompt,
    });

    // Take only the first n queries
    return (result.object as { queries: string[] }).queries.slice(0, n);
} 