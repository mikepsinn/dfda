
/**
 * @jest-environment node
 */
import { DiseaseCureModel, DiseaseCureModelParameters } from '../../lib/health-econ-simulation/disease-cure-model';

describe('DiseaseCureModel Report Generation', () => {
  const baseParams: DiseaseCureModelParameters = {
    lastCureYear: 1980,
    drugsApprovedPerYear: 50,
    totalDiseases: 2000,
    developmentToAccessTime: 15
  };

  it('should generate markdown report with expected structure', () => {
    const model = new DiseaseCureModel(baseParams);
    const report = model.generateReport();
    
    // Write report to file
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, 'disease-cure-report.md');
    fs.writeFileSync(reportPath, report);
    
    // Verify file exists
    expect(fs.existsSync(reportPath)).toBe(true);
    // Log report path
    console.log(`Report saved to: ${reportPath}`);
    // Verify file content
    const fileContent = fs.readFileSync(reportPath, 'utf8');
    expect(fileContent).toEqual(report);
  });
});
