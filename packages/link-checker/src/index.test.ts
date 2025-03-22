import { promises as fs } from 'fs';
import { checkLinks, formatResults } from './index';

describe('Link Checker', () => {
  const testDir = 'test-files';
  
  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Create a test markdown file with some links
    const testFile = `${testDir}/test.md`;
    const content = `# Test Document
[Example](https://example.com)
[Google](https://google.com)
[GitHub](https://github.com)
[Invalid](https://this-is-not-a-real-domain-123.com)`;
    
    await fs.writeFile(testFile, content);
    console.log('Created test file:', testFile);
  });

  it('should find and validate links in markdown files', async () => {
    const pattern = 'test-files/*.md';
    console.log('Using pattern:', pattern);
    
    const result = await checkLinks(pattern);
    console.log('Result:', result);
    
    const output = formatResults(result);
    expect(output).toContain('Valid Links');
    expect(output).toContain('Invalid Links');
    expect(output).toContain('example.com');
    expect(output).toContain('google.com');
    expect(output).toContain('github.com');
    expect(output).toContain('this-is-not-a-real-domain-123.com');
  });
}); 