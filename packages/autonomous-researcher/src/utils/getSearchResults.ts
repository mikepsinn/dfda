import Exa, { RegularSearchOptions, SearchResult, TextContentsOptions } from "exa-js";
import { DefaultContentsOptions } from "../types";

const defaultTextOptions: TextContentsOptions = {
    maxCharacters: 10000,
    includeHtmlTags: false
};

// Helper function to extract serializable data from SearchResult
function getSerializableResult(result: SearchResult<DefaultContentsOptions>): any {
    return {
        title: result.title,
        url: result.url,
        text: result.text,
        highlights: result.highlights,
        publishedDate: result.publishedDate,
        author: result.author,
        score: result.score
    };
}

export async function getSearchResults(
    queries: string[], 
    options?: RegularSearchOptions,
    apiKey?: string
): Promise<SearchResult<DefaultContentsOptions>[]> {
    if (!apiKey) {
        throw new Error("Exa API key is required");
    }

    const exa = new Exa(apiKey);
    const results: SearchResult<DefaultContentsOptions>[] = [];

    for (const query of queries) {
        try {
            console.log(`Searching Exa for: ${query}`);
            const searchResponse = await exa.searchAndContents(query, {
                numResults: options?.numResults ?? 5,
                useAutoprompt: options?.useAutoprompt ?? false,
                ...options,
                text: defaultTextOptions,
                highlights: {
                    numSentences: 3,
                    highlightsPerUrl: 5,
                    query
                },
                extras: {
                    imageLinks: 5
                }
            });
            
            if (searchResponse?.results?.length > 0) {
                const serializableResults = searchResponse.results.map(getSerializableResult);
                results.push(...serializableResults);
            }
        } catch (error) {
            console.error(`Error processing query "${query}":`, error);
            continue;
        }
    }
    return results;
}

export async function getSearchResultsByUrl(
    url: string, 
    linksPerQuery: number = 5,
    apiKey?: string
): Promise<SearchResult<DefaultContentsOptions>[]> {
    if (!apiKey) {
        throw new Error("Exa API key is required");
    }

    const exa = new Exa(apiKey);

    try {
        console.log(`Getting Exa contents for URL: ${url}`);
        const searchResponse = await exa.getContents(
            [url],
            {
                text: defaultTextOptions,
                highlights: {
                    numSentences: 3,
                    highlightsPerUrl: 5
                },
                extras: {
                    imageLinks: 5
                }
            }
        );
        
        if (searchResponse?.results?.length > 0) {
            const serializableResults = searchResponse.results.map(getSerializableResult);
            return serializableResults;
        }
        return [];
    } catch (error) {
        console.error(`Error processing URL search "${url}":`, error);
        return [];
    }
} 