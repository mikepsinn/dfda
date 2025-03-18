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

## Implementation Status

### Core Features
- [x] GitHub project scanning functionality
  - [x] Recursive directory traversal
  - [x] File type detection and parsing
  - [x] Link extraction from supported file types
  - [x] Unit tests for scanning functionality

### Link Management
- [x] External link validation
  - [x] HTTP status checking
  - [x] Timeout handling
  - [x] Rate limiting support
  - [x] Unit tests for link validation

### Configuration
- [x] Auto-generated config file (`link-checker.json`)
  - [x] Successful links tracking
  - [x] Failed links tracking
  - [x] Last check timestamp for each link
  - [x] Unit tests for config management

### Performance Features
- [x] Skip previously failed links
- [x] Daily check limitation for external links
- [x] Cleanup of removed links from config
- [x] Unit tests for caching behavior

### Integration
- [ ] CLI tool implementation
- [ ] Package.json integration
- [ ] Documentation
- [ ] Integration tests

## Product Requirements Document (PRD)

### Overview
A TypeScript-based link validation tool that scans GitHub projects for links, maintains a configuration file of link statuses, and optimizes validation through intelligent caching and failure tracking.

### Core Requirements

1. **Project Scanning**
   - Scan all supported file types in a GitHub project
   - Support for MD, MDX, TS, TSX, JS, and JSX files
   - Extract both external and internal links

2. **Configuration Management**
   - Generate `link-validator.config.json` in project root
   - Store successful and failed external links
   - Track last validation timestamp for each link
   - Auto-cleanup of non-existent links

3. **Link Validation**
   - Validate external links with proper HTTP checks
   - Skip previously failed links
   - Limit external link checks to once per day
   - Support for timeout and rate limiting

### Technical Requirements

1. **Performance**
   - Efficient file traversal
   - Caching of validation results
   - Parallel link validation where appropriate

2. **Dependencies**
   - Use established libraries for:
     - File system operations
     - HTTP requests
     - Link parsing
     - Config file management

3. **Testing**
   - Unit tests for core functionality
   - Integration tests for full workflow
   - Mock HTTP responses for testing

### Configuration File Structure
```json
{
  "version": "1.0",
  "lastUpdated": "ISO-8601-timestamp",
  "successfulLinks": {
    "https://example.com": {
      "lastChecked": "ISO-8601-timestamp",
      "locations": ["path/to/file1.md", "path/to/file2.tsx"]
    }
  },
  "failedLinks": {
    "https://failed-example.com": {
      "lastChecked": "ISO-8601-timestamp",
      "error": "404 Not Found",
      "locations": ["path/to/file3.md"]
    }
  }
}
```

## Package Architecture

```
link-checker/
├── src/
│   ├── core/                    # Core functionality
│   │   ├── types.ts            # Type definitions
│   │   ├── scanner.ts          # Link scanning logic
│   │   └── config.ts           # Configuration management
│   ├── validators/             # URL validation
│   │   └── index.ts            # Unified validation logic
│   ├── extractors/            # Link extraction
│   │   └── index.ts           # Link extraction from different file types
│   └── index.ts               # Main entry point + formatting
├── tests/
│   └── unit/                  # Unit tests
├── jest.config.js             # Jest configuration
└── package.json              # Project configuration
```

Each directory serves a specific purpose:

- `core/`: Contains the fundamental types and core functionality
  - `types.ts`: Defines interfaces like `LinkInfo`, `ValidationResult`, etc.
  - `scanner.ts`: Implements link scanning and extraction
  - `config.ts`: Handles all configuration management (scan results and skip lists)

- `validators/`: Contains unified URL validation logic
  - Single `validateUrl` function that handles all URL types
  - Supports external URLs (via HTTP), local files, and special protocols

- `extractors/`: Contains link extraction logic
  - Extracts links from Markdown, HTML, JSX, and import statements
  - Provides location information (file, line, column)

The main entry point (`index.ts`) provides:
- Simple API for link checking
- Basic formatting in text or JSON format
- Configuration management functions

