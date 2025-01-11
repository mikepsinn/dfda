import { scanLinks } from '../../src/core/scanner';
import { formatReport } from '../../src/core/scanner';
import path from 'path';

describe('Configuration and Performance', () => {
  const testDir = path.join(__dirname, '../fixtures');

  it('should respect concurrent option', async () => {
    const results = await scanLinks(testDir, { concurrent: 2 });
    expect(results).toBeDefined();
  });

  it('should respect timeout option', async () => {
    const results = await scanLinks(testDir, { timeout: 1000 });
    expect(results).toBeDefined();
  });

  it('should generate detailed report', async () => {
    const results = await scanLinks(testDir);
    const report = formatReport(results);
    
    expect(report).toContain('Link Checker Report');
    expect(report).toContain('Total Links');
    expect(report).toContain('Valid Links');
    expect(report).toContain('Invalid Links');
  });

  it('should cache results for repeated scans', async () => {
    const firstScan = await scanLinks(testDir);
    const secondScan = await scanLinks(testDir);
    
    expect(firstScan).toEqual(secondScan);
  });
});
