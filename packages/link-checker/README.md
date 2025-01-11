# Link Validator

A robust link validation library for JavaScript/TypeScript projects that checks URLs in various file types including Markdown, JSX/TSX, and TypeScript/JavaScript files.

## Features

- 🔍 **Multi-Format Support**: Validates URLs in MD, MDX, TS, TSX, JS, and JSX files
- 🌐 **External Link Validation**: Verifies that external URLs are accessible
- 📁 **Local Link Validation**: Ensures internal file references are valid
- ⚡ **Performance Optimized**: Includes caching for faster repeated checks
- 🎯 **Configurable**: Customize file patterns, exclusions, and validation rules
- 📊 **Detailed Reporting**: Get precise link locations and error information
- 🔒 **Type-Safe**: Written in TypeScript with full type definitions

## Installation

```bash
npm install link-validator
```

## Quick Start

```typescript
import { scanLinks } from 'link-validator';

const results = await scanLinks('./docs', {
  checkLiveLinks: true,
  excludePatterns: ['node_modules/**']
});

// Handle results
results.forEach(link => {
  if (!link.isValid) {
    console.log(`❌ Invalid link: ${link.url}`);
    console.log(`   Location: ${link.location.filePath}:${link.location.lineNumber}`);
    console.log(`   Error: ${link.error}`);
  }
});
```

## API Reference

### `scanLinks(rootDir: string, options?: ScanOptions): Promise<LinkInfo[]>`

Scans a directory recursively for links in supported file types.

#### Options

```typescript
interface ScanOptions {
  checkLiveLinks?: boolean;        // Validate external URLs (default: false)
  includePatterns?: string[];      // Glob patterns for files to include
  excludePatterns?: string[];      // Glob patterns for files to exclude
  concurrent?: number;             // Max concurrent requests (default: 5)
  timeout?: number;                // Request timeout in ms (default: 5000)
}
```

#### Return Type

```typescript
interface LinkInfo {
  url: string;                     // The URL or link path
  location: {
    filePath: string;             // File containing the link
    lineNumber: number;           // Line number in file
    columnNumber?: number;        // Column number in file
  };
  isValid?: boolean;              // Validation result
  error?: string;                 // Error message if invalid
}
```

### `validateLink(url: string): Promise<boolean>`

Validates a single URL.

```typescript
import { validateLink } from 'link-validator';

const isValid = await validateLink('https://example.com');
```

## Examples

### Basic Usage

```typescript
import { scanLinks } from 'link-validator';

// Check all markdown files
const results = await scanLinks('./content', {
  includePatterns: ['**/*.md'],
  checkLiveLinks: true
});
```

### Custom Error Handling

```typescript
import { scanLinks } from 'link-validator';

try {
  const results = await scanLinks('./src');
  const invalidLinks = results.filter(link => !link.isValid);
  
  if (invalidLinks.length > 0) {
    console.error('Found invalid links:');
    invalidLinks.forEach(link => {
      console.error(`- ${link.url} in ${link.location.filePath}`);
    });
    process.exit(1);
  }
} catch (error) {
  console.error('Error scanning links:', error);
  process.exit(1);
}
```

### CI Integration

```typescript
import { scanLinks } from 'link-validator';

async function validateInCI() {
  const results = await scanLinks('.', {
    checkLiveLinks: true,
    excludePatterns: [
      'node_modules/**',
      'dist/**',
      'coverage/**'
    ]
  });

  const invalidLinks = results.filter(link => !link.isValid);
  if (invalidLinks.length > 0) {
    console.error('CI Check Failed: Invalid links found');
    process.exit(1);
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Mike P. Sinn

## Repository

[GitHub Repository](https://github.com/mikepsinn/link-validator) 