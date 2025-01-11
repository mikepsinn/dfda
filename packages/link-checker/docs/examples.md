# Link Validator Examples

## Basic Usage

### Scanning a Directory

```typescript
import { scanLinks } from 'link-validator';

async function checkDocs() {
  const results = await scanLinks('./docs', {
    checkLiveLinks: true,
    excludePatterns: ['node_modules/**']
  });

  results.forEach(link => {
    if (!link.isValid) {
      console.log(`❌ Invalid link: ${link.url}`);
      console.log(`   Location: ${link.location.filePath}:${link.location.lineNumber}`);
      console.log(`   Error: ${link.error}`);
    }
  });
}
```

### Validating a Single URL

```typescript
import { validateLink } from 'link-validator';

async function checkUrl(url: string) {
  const isValid = await validateLink(url);
  console.log(`URL ${url} is ${isValid ? 'valid' : 'invalid'}`);
}
```

## Advanced Usage

### Custom File Patterns

```typescript
import { scanLinks } from 'link-validator';

async function checkSpecificFiles() {
  const results = await scanLinks('.', {
    includePatterns: [
      '**/*.md',
      '**/*.mdx',
      'src/**/*.tsx'
    ],
    excludePatterns: [
      'node_modules/**',
      'dist/**',
      'coverage/**'
    ]
  });
}
```

### Error Handling

```typescript
import { scanLinks } from 'link-validator';

async function robustLinkCheck() {
  try {
    const results = await scanLinks('./content');
    const invalidLinks = results.filter(link => !link.isValid);
    
    if (invalidLinks.length > 0) {
      console.error('Found invalid links:');
      invalidLinks.forEach(link => {
        console.error(`- ${link.url} in ${link.location.filePath}`);
      });
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during link checking:', error);
    process.exit(1);
  }
}
```

### CI/CD Integration

```typescript
import { scanLinks } from 'link-validator';

async function validateInCI() {
  const results = await scanLinks('.', {
    checkLiveLinks: true,
    excludePatterns: [
      'node_modules/**',
      'dist/**',
      'coverage/**'
    ],
    concurrent: 5,
    timeout: 10000
  });

  const invalidLinks = results.filter(link => !link.isValid);
  if (invalidLinks.length > 0) {
    console.error('CI Check Failed: Invalid links found');
    invalidLinks.forEach(link => {
      console.error(`- ${link.url} (${link.error})`);
      console.error(`  File: ${link.location.filePath}:${link.location.lineNumber}`);
    });
    process.exit(1);
  }
}
```

### Custom Reporter

```typescript
import { scanLinks, LinkInfo } from 'link-validator';

class CustomReporter {
  private invalidLinks: LinkInfo[] = [];

  onInvalidLink(link: LinkInfo) {
    this.invalidLinks.push(link);
    console.warn(`Warning: Invalid link found - ${link.url}`);
  }

  generateReport() {
    return {
      totalInvalid: this.invalidLinks.length,
      details: this.invalidLinks
    };
  }
}

async function checkWithCustomReporting() {
  const reporter = new CustomReporter();
  const results = await scanLinks('./docs');

  results.forEach(link => {
    if (!link.isValid) {
      reporter.onInvalidLink(link);
    }
  });

  const report = reporter.generateReport();
  console.log(`Found ${report.totalInvalid} invalid links`);
}
``` 