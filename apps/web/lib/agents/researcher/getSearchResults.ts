import Exa, {RegularSearchOptions, SearchResult, TextContentsOptions} from "exa-js";
import { CacheService } from '@/lib/services/cache-service';

const exa = new Exa(process.env.EXASEARCH_API_KEY);
const cacheService = CacheService.getInstance();

const defaultTextOptions: TextContentsOptions = {
    maxCharacters: 10000,
    includeHtmlTags: false
};

type DefaultContentsOptions = {
    text: TextContentsOptions;
    highlights: {
        numSentences: 3,
        highlightsPerUrl: 5
    };
    extras: {
        imageLinks: 5
    };
};

// Helper function to extract serializable data from SearchResult
export function getSerializableResult(result: SearchResult<DefaultContentsOptions>): any {
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

export async function getSearchResults(queries: string[], options?: RegularSearchOptions): Promise<SearchResult<DefaultContentsOptions>[]> {
    const results: SearchResult<DefaultContentsOptions>[] = [];
    for (const query of queries) {
        try {
            // Generate cache key based on query and options
            const optionsKey = options ? 
                Buffer.from(JSON.stringify(options)).toString('base64') : 
                'default';
            const cacheKey = `exa:${Buffer.from(query).toString('base64')}:${optionsKey}`;
            
            // Try to get cached results
            const cachedResults = await cacheService.get<any[]>(cacheKey);
            if (cachedResults) {
                console.log(`Cache hit for Exa search: ${query}`);
                results.push(...cachedResults);
                continue;
            }

            // If not in cache, perform the search
            console.log(`Cache miss for Exa search: ${query}`);
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
            
            // Cache the serializable results
            if (searchResponse?.results?.length > 0) {
                const serializableResults = searchResponse.results.map(getSerializableResult);
                await cacheService.set(cacheKey, serializableResults);
                results.push(...serializableResults);
            }
        } catch (error) {
            console.error(`Error processing query "${query}":`, error);
            // Continue with next query instead of failing completely
            continue;
        }
    }
    return results;
}

export async function getSearchResultsByDomain(domain: string, queries: string[], options?: RegularSearchOptions): Promise<SearchResult<DefaultContentsOptions>[]> {
    const results: SearchResult<DefaultContentsOptions>[] = [];
    for (const query of queries) {
        try {
            // Generate cache key based on domain, query and options
            const optionsKey = options ? 
                Buffer.from(JSON.stringify(options)).toString('base64') : 
                'default';
            const cacheKey = `exa:domain:${Buffer.from(domain).toString('base64')}:${Buffer.from(query).toString('base64')}:${optionsKey}`;
            
            // Try to get cached results
            const cachedResults = await cacheService.get<any[]>(cacheKey);
            if (cachedResults) {
                console.log(`Cache hit for Exa domain search: ${domain}:${query}`);
                results.push(...cachedResults);
                continue;
            }

            // If not in cache, perform the search
            console.log(`Cache miss for Exa domain search: ${domain}:${query}`);
            const searchResponse = await exa.searchAndContents(query, {
                ...options,
                numResults: options?.numResults ?? 5,
                useAutoprompt: options?.useAutoprompt ?? false,
                includeDomains: [domain],
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
            
            // Cache the serializable results
            if (searchResponse?.results?.length > 0) {
                const serializableResults = searchResponse.results.map(getSerializableResult);
                await cacheService.set(cacheKey, serializableResults);
                results.push(...serializableResults);
            }
        } catch (error) {
            console.error(`Error processing domain search "${domain}:${query}":`, error);
            continue;
        }
    }
    return results;
}

export async function getSearchResultsByUrl(url: string, linksPerQuery: number = 5): Promise<SearchResult<DefaultContentsOptions>[]> {
    try {
        // Generate cache key based on URL and options
        const cacheKey = `exa:url:${Buffer.from(url).toString('base64')}:${linksPerQuery}`;
        
        // Try to get cached results
        const cachedResults = await cacheService.get<any[]>(cacheKey);
        if (cachedResults) {
            console.log(`Cache hit for Exa URL search: ${url}`);
            return cachedResults;
        }

        // If not in cache, perform the search
        console.log(`Cache miss for Exa URL search: ${url}`);
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
        
        // Cache the serializable results
        if (searchResponse?.results?.length > 0) {
            const serializableResults = searchResponse.results.map(getSerializableResult);
            await cacheService.set(cacheKey, serializableResults);
            return serializableResults;
        }
        return [];
    } catch (error) {
        console.error(`Error processing URL search "${url}":`, error);
        return [];
    }
}
