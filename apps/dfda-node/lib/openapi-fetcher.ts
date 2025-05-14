import fetch from 'node-fetch';
import * as fs from 'fs';
import * as s2o from 'swagger2openapi';

// --- Configuration for cleaning ---
const TABLES_TO_EXCLUDE = ['supabase_migrations', 'pgsodium_key', 'pgsodium_masks', 'key', 'config', 'decrypted_secrets', 'hook_delivery_attempt', 'hooks', 'refresh_tokens_expires_in', 'secrets', 'session_token', 'sso_provider_id', 'sso_sessions_id'];
const PATHS_TO_EXCLUDE = ['/rpc/show_config', '/rpc/get_status', '/rpc/list_hooks', '/rpc/list_secrets', '/rpc/create_key', '/rpc/get_hook_delivery_attempts_id', '/rpc/list_hook_delivery_attempts', '/rpc/list_providers', '/rpc/list_sso_sessions', '/rpc/get_decrypted_secret_id', '/rpc/get_decrypted_secrets', '/rpc/create_sso_provider', '/rpc/create_hook', '/rpc/get_key_id', '/rpc/list_keys', '/rpc/get_hook_id', '/rpc/get_sso_provider_id', '/rpc/get_sso_session_id', '/rpc/get_session_token', '/rpc/get_secret_id', '/rpc/get_config', '/rpc/can_update_provider_saml', '/rpc/create_decrypted_secret'];
const TAGS_TO_EXCLUDE: string[] = ['HookDeliveryAttempt', 'Hooks', 'Key', 'Secrets', 'SsoProviderId', 'SsoSessionsId', 'pgsodium', 'internal']; // Add any specific tags to always exclude (also auto-excludes tags matching TABLES_TO_EXCLUDE)

// --- Interfaces ---
interface FetcherConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  siteUrl: string; // To construct proxyUrl for the spec's server URL
}

interface _InternalOpenApiCleanerOptions {
  tablesToExclude?: string[];
  pathsToExclude?: string[];
  tagsToExclude?: string[];
  proxyUrl?: string;
  removeRootPath?: boolean;
}

// --- Internal Helper Functions ---

async function _fetchRawSpec(url: string): Promise<any> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function _convertToOpenApiV3(spec: any): Promise<any> {
  if (spec.swagger && spec.swagger === '2.0') {
    console.log('Converting Swagger 2.0 spec to OpenAPI 3.0...');
    let convertedSpec: any = null;
    try {
      const options = { patch: true, warnOnly: true, fatalOnly: false, resolveInternal: true }; // source: spec is implicit
      const conversionResult = await s2o.convert(spec, options);
      
      if (conversionResult.openapi) {
        console.log('Successfully converted to OpenAPI 3.0.');
        if (conversionResult.messages && conversionResult.messages.length > 0) {
          conversionResult.messages.forEach((msg: any) => console.warn(`[s2o warning]: ${msg.message} (${msg.pointer})`));
        }
        convertedSpec = conversionResult.openapi;
      } else {
        // This case should be rare if fatalOnly is false, but handle defensively
        console.error('Conversion to OpenAPI 3.0 did not produce an openapi object, though no fatal error was thrown.');
        if (conversionResult.messages && conversionResult.messages.length > 0) {
          conversionResult.messages.forEach((msg: any) => console.error(`[s2o message]: ${msg.message} (${msg.pointer})`));
        }
        throw new Error('Conversion to OpenAPI 3.0 failed to produce output.');
      }
    } catch (err: any) {
      const errorMessage = err.message || String(err);
      console.error('Error during Swagger 2.0 to OpenAPI 3.0 conversion process:', errorMessage);
      throw new Error(`Conversion to OpenAPI 3.0 failed: ${errorMessage}`); // Re-throw critical errors
    }
    return convertedSpec;
  }
  if (spec.openapi && spec.openapi.startsWith('3.')) {
    console.log('Spec is already OpenAPI 3.x.');
    return spec;
  }
  console.warn('Spec is not Swagger 2.0 or OpenAPI 3.x. Attempting to use as is.');
  return spec;
}

function _cleanSpec(spec: any, options: _InternalOpenApiCleanerOptions): any {
  const newSpec = JSON.parse(JSON.stringify(spec)); // Deep copy to avoid modifying original

  // 1. Replace server URL
  if (options.proxyUrl) {
    if (newSpec.servers && newSpec.servers.length > 0) {
      newSpec.servers[0].url = options.proxyUrl;
    } else {
      newSpec.servers = [{ url: options.proxyUrl, description: 'DFDA API Proxy' }];
    }
    if (newSpec.servers.length > 1) {
      newSpec.servers = [newSpec.servers[0]]; // Keep only the first (proxy) server
    }
    // Remove host/basePath/schemes for OAS2 (should be handled by conversion, but good to double check for OAS3)
    delete newSpec.host;
    delete newSpec.basePath;
    delete newSpec.schemes;
  }

  // 2. Remove root '/' path if requested
  if (options.removeRootPath && newSpec.paths && newSpec.paths['/']) {
    delete newSpec.paths['/'];
  }

  // 3. Remove specified paths and paths related to excluded tables
  if (newSpec.paths) {
    for (const pathKey of Object.keys(newSpec.paths)) {
      if (
        (options.tablesToExclude && options.tablesToExclude.some(table => pathKey.toLowerCase().includes(`/rest/v1/${table.toLowerCase()}`))) ||
        (options.tablesToExclude && options.tablesToExclude.some(table => pathKey.toLowerCase().includes(`/${table.toLowerCase()}`))) || // also catch direct table names in paths like /table_name
        (options.pathsToExclude && options.pathsToExclude.some(excludePath => pathKey.toLowerCase().includes(excludePath.toLowerCase())))
      ) {
        delete newSpec.paths[pathKey];
      }
    }
  }

  // 4. Remove specified schemas/definitions (for both OAS2 'definitions' and OAS3 'components.schemas')
  const schemasContainer = newSpec.components?.schemas || newSpec.definitions;
  if (schemasContainer) {
    for (const schemaKey of Object.keys(schemasContainer)) {
      if (options.tablesToExclude && options.tablesToExclude.some(table => schemaKey.toLowerCase() === table.toLowerCase())) {
        delete schemasContainer[schemaKey];
      }
    }
  }
  if (newSpec.definitions && Object.keys(newSpec.definitions).length === 0) delete newSpec.definitions;
  if (newSpec.components && newSpec.components.schemas && Object.keys(newSpec.components.schemas).length === 0) delete newSpec.components.schemas;


  // 5. Remove specified tags and tags matching excluded tables
  if (newSpec.tags && Array.isArray(newSpec.tags)) {
    newSpec.tags = newSpec.tags.filter((tag: { name: string }) => {
      const tagNameLower = tag.name.toLowerCase();
      const shouldExcludeByTag = options.tagsToExclude && options.tagsToExclude.some(excludeTag => tagNameLower === excludeTag.toLowerCase());
      const shouldExcludeByTable = options.tablesToExclude && options.tablesToExclude.some(table => tagNameLower === table.toLowerCase());
      return !shouldExcludeByTag && !shouldExcludeByTable;
    });
  }
  
  // TODO: Add more advanced cleanup:
  // - Remove orphaned schema definitions if any were deleted due to table exclusions
  // - Remove orphaned tags if any operations using them were deleted

  return newSpec;
}

// --- Main Exported Function ---
export async function fetchAndProcessOpenApiSpec(config?: Partial<FetcherConfig>): Promise<any | null> {
  // Use provided config or fall back to process.env
  const supabaseUrl = config?.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = config?.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = config?.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL;

  if (!supabaseUrl || !supabaseAnonKey || !siteUrl) {
    console.error('[Fetcher] Missing required options for fetching/processing spec: supabaseUrl, supabaseAnonKey, and siteUrl are all required.');
    return null;
  }

  const specUrl = `${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`;
  const proxyUrl = `${siteUrl.replace(/\/$/, '')}/api/sb`; // For the spec's server URL

  try {
    console.log(`[Fetcher] Fetching raw OpenAPI spec from ${specUrl}...`);
    let spec = await _fetchRawSpec(specUrl);
    console.log('[Fetcher] Successfully fetched raw OpenAPI spec.');

    spec = await _convertToOpenApiV3(spec);
    // _convertToOpenApiV3 logs its own success/errors

    console.log('[Fetcher] Cleaning and finalizing OpenAPI spec...');
    const cleanerOptions: _InternalOpenApiCleanerOptions = {
      proxyUrl: proxyUrl,
      tablesToExclude: TABLES_TO_EXCLUDE,
      pathsToExclude: PATHS_TO_EXCLUDE,
      tagsToExclude: TAGS_TO_EXCLUDE,
      removeRootPath: true 
    };
    const processedSpec = _cleanSpec(spec, cleanerOptions);
    console.log('[Fetcher] Finished cleaning and finalizing spec.');
    return processedSpec;

  } catch (error: any) {
    console.error('[Fetcher] Error in fetchAndProcessOpenApiSpec:', error.message || error);
    return null;
  }
}

// --- Optional Exported Utilities ---

/**
 * Saves the OpenAPI spec to a file.
 * (Kept for scripts/generate-api-client.ts or other potential uses)
 */
export function saveOpenApiSpec(spec: any, filePath: string) {
  if (!fs) {
    console.error("[Fetcher] 'fs' module not available. Cannot save spec.");
    return;
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify(spec, null, 2));
  } catch (error: any) {
    console.error(`[Fetcher] Error saving spec to ${filePath}:`, error.message || error);
  }
} 