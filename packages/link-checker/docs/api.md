# Link Validator API Documentation

## Core API

### scanLinks(rootDir: string, options?: ScanOptions): Promise<LinkInfo[]>

Scans a directory recursively for links in supported file types.

#### Parameters

- `rootDir` (string): The root directory to start scanning from
- `options` (ScanOptions, optional): Configuration options for the scan

#### ScanOptions

```typescript
interface ScanOptions {
  // Whether to validate external URLs (HTTP/HTTPS)
  checkLiveLinks?: boolean;

  // Glob patterns for files to include in the scan
  includePatterns?: string[];

  // Glob patterns for files to exclude from the scan
  excludePatterns?: string[];

  // Maximum number of concurrent requests for link validation
  concurrent?: number;

  // Timeout in milliseconds for external link validation
  timeout?: number;
}
```

#### Returns

Promise<LinkInfo[]> - Array of link information objects

```typescript
interface LinkInfo {
  // The URL or link path found
  url: string;

  // Location information for the link
  location: {
    // Path to the file containing the link
    filePath: string;
    // Line number where the link appears
    lineNumber: number;
    // Column number where the link starts (optional)
    columnNumber?: number;
  };

  // Whether the link is valid (undefined if not checked)
  isValid?: boolean;

  // Error message if link is invalid
  error?: string;
}
```

### validateLink(url: string): Promise<boolean>

Validates a single URL by checking its accessibility.

#### Parameters

- `url` (string): The URL to validate

#### Returns

Promise<boolean> - True if the URL is valid and accessible, false otherwise

## Error Handling

The library throws the following types of errors:

- `InvalidPathError`: When the provided path is invalid or inaccessible
- `ValidationError`: When link validation fails
- `ConfigurationError`: When provided options are invalid

## Examples

See [examples.md](./examples.md) for detailed usage examples. 