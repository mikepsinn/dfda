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
- [ ] GitHub project scanning functionality
  - [ ] Recursive directory traversal
  - [ ] File type detection and parsing
  - [ ] Link extraction from supported file types
  - [ ] Unit tests for scanning functionality

### Link Management
- [ ] External link validation
  - [ ] HTTP status checking
  - [ ] Timeout handling
  - [ ] Rate limiting support
  - [ ] Unit tests for link validation

### Configuration
- [ ] Auto-generated config file (`link-validator.config.json`)
  - [ ] Successful links tracking
  - [ ] Failed links tracking
  - [ ] Last check timestamp for each link
  - [ ] Unit tests for config management

### Performance Features
- [ ] Skip previously failed links
- [ ] Daily check limitation for external links
- [ ] Cleanup of removed links from config
- [ ] Unit tests for caching behavior

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

