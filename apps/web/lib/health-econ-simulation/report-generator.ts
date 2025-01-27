import { OutcomeMetric } from './outcomes/muscle-mass';
import { reportSections } from './report-config';

// Helper function for number formatting
function formatNumber(num: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
}

// Helper function to convert HTML calculation explanations to markdown
function convertCalculationHtmlToMarkdown(html: string): string {
    let markdown = html
        // Remove calculation explanation wrapper
        .replace(/<div class="calculation-explanation">/g, '')
        
        // Handle ordered and unordered lists properly
        .replace(/<ol>/g, '\n')
        .replace(/<\/ol>/g, '\n')
        .replace(/<ul>/g, '\n')
        .replace(/<\/ul>/g, '\n')
        .replace(/<li>/g, '- ')
        .replace(/<\/li>/g, '\n')
        
        // Handle line breaks and paragraphs
        .replace(/<br\/?>/g, '\n')
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n\n')
        
        // Handle emphasis
        .replace(/<strong>/g, '**')
        .replace(/<\/strong>/g, '**')
        .replace(/<em>/g, '*')
        .replace(/<\/em>/g, '*')
        
        // Handle formula blocks - convert to indented code blocks
        .replace(/<div class="formula">/g, '\n    ')
        .replace(/<\/div>/g, '\n')
        
        // Clean up any remaining HTML tags
        .replace(/<[^>]+>/g, '')
        
        // Fix spacing around lists
        .replace(/\n- /g, '\n\n- ')
        
        // Clean up multiple spaces
        .replace(/[ ]{2,}/g, ' ')
        
        // Clean up multiple newlines
        .replace(/\n{3,}/g, '\n\n')
        
        // Trim whitespace
        .trim();
    
    // Ensure proper spacing around code blocks
    markdown = markdown.split('\n').map(line => {
        // If line starts with spaces (code block), preserve indentation
        if (line.startsWith('    ')) {
            return line;
        }
        // Otherwise trim line
        return line.trim();
    }).join('\n');
    
    return markdown;
}

export interface ReportSection {
    title: string;
    metrics: Record<string, number>;
    metricDefinitions: Record<string, OutcomeMetric>;
    baselineMetrics?: Record<string, any>;
}

export interface InterventionDetails {
    name: string;
    value: number | string;
    unit?: string;
    populationSize: number;
}

export interface ReportData {
    title: string;
    description?: string;
    intervention: InterventionDetails;
    sections: ReportSection[];
}

function formatMetricValue(value: number, metric: OutcomeMetric): string {
    return metric.generateDisplayValue ? metric.generateDisplayValue(value) : value.toString();
}

function generateMetricDetails(value: number, metric: OutcomeMetric, baselineMetrics?: Record<string, any>): string {
    console.log('[generateMetricDetails] Input:', {
        value,
        metricName: metric.displayName,
        baselineMetrics
    });

    const sections = [];
    
    // Main value and description
    sections.push(`### ${metric.emoji} ${metric.displayName}`);
    sections.push(`**Value:** ${formatMetricValue(value, metric)}`);
    sections.push(`> ${metric.description}`);
    
    // Source reference
    if (metric.sourceUrl) {
        const domain = new URL(metric.sourceUrl).hostname;
        sections.push(`*Source: [${domain}](${metric.sourceUrl})*`);
    }
    
    // Calculations section
    sections.push('\n#### Calculations');
    console.log('[generateMetricDetails] Calling generateCalculationExplanation for', metric.displayName);
    const calculationExplanation = metric.generateCalculationExplanation(
        baselineMetrics?.muscle_mass_increase_per_person || 0,
        baselineMetrics
    );
    sections.push(convertCalculationHtmlToMarkdown(calculationExplanation));
    
    // Model parameters section
    if (metric.modelParameters && metric.modelParameters.length > 0) {
        sections.push('\n#### Model Parameters');
        for (const param of metric.modelParameters) {
            sections.push(`##### ${param.emoji} ${param.displayName}`);
            sections.push(`${param.description}`);
            sections.push(`**Default Value:** ${param.generateDisplayValue ? 
                param.generateDisplayValue(param.defaultValue) : 
                `${param.defaultValue} ${param.unitName || ''}`}`);
            if (param.sourceUrl) {
                const domain = new URL(param.sourceUrl).hostname;
                sections.push(`*Source: [${domain}](${param.sourceUrl})*`);
            }
            sections.push(''); // Add empty line between parameters
        }
    }
    
    // Sensitivity analysis section
    if (metric.calculateSensitivity) {
        sections.push('\n#### Sensitivity Analysis');
        const sensitivity = metric.calculateSensitivity(
            baselineMetrics?.muscle_mass_increase_per_person || 0,
            baselineMetrics
        );
        sections.push(`**Best Case:** ${formatMetricValue(sensitivity.bestCase, metric)}`);
        sections.push(`**Worst Case:** ${formatMetricValue(sensitivity.worstCase, metric)}`);
        
        if (sensitivity.assumptions && sensitivity.assumptions.length > 0) {
            sections.push('\n**Key Assumptions:**');
            sections.push(sensitivity.assumptions.map(a => `- ${a}`).join('\n'));
        }
    }
    
    return sections.join('\n\n');
}

function generateMethodologySection(): string {
    const sections = [];
    
    // Methodology
    sections.push(`## ${reportSections.methodology.title}`);
    sections.push(reportSections.methodology.points.map(point => `- ${point}`).join('\n'));
    
    // Limitations
    sections.push(`\n## ${reportSections.limitations.title}`);
    sections.push(reportSections.limitations.points.map(point => `- ${point}`).join('\n'));
    
    // Statistical Validation
    sections.push(`\n## ${reportSections.statisticalValidation.title}`);
    sections.push(reportSections.statisticalValidation.description);
    sections.push(reportSections.statisticalValidation.points.map(point => `- ${point}`).join('\n'));
    sections.push(`\n${reportSections.statisticalValidation.covariates.title}`);
    sections.push(reportSections.statisticalValidation.covariates.points.map(point => `  - ${point}`).join('\n'));
    
    return sections.join('\n\n');
}

export function generateMarkdownReport(data: ReportData): string {
    const sections = [];
    
    // Title and Description
    sections.push(`# ${data.title}`);
    if (data.description) {
        sections.push(data.description);
    }
    
    // Intervention Details
    sections.push('## Intervention Details');
    sections.push(`- **${data.intervention.name}**: ${data.intervention.value}${data.intervention.unit ? ` ${data.intervention.unit}` : ''}`);
    sections.push(`- **Target Population**: ${formatNumber(data.intervention.populationSize, 0)} individuals`);
    
    // Metrics Sections
    for (const section of data.sections) {
        sections.push(`\n## ${section.title}`);
        
        for (const [key, value] of Object.entries(section.metrics)) {
            const metric = section.metricDefinitions[key];
            if (metric) {
                sections.push(generateMetricDetails(
                    value, 
                    metric, 
                    {
                        ...section.baselineMetrics,
                        population_size: data.intervention.populationSize,
                        muscle_mass_increase_per_person: data.intervention.value
                    }
                ));
            }
        }
    }
    
    // Methodology and Limitations
    sections.push('\n' + generateMethodologySection());
    
    // Add timestamp
    sections.push(`\n---\n*Report generated on ${new Date().toISOString()}*`);
    
    return sections.join('\n\n');
}

// Example usage:
/*
const reportData: ReportData = {
    title: "Muscle Mass Intervention Analysis",
    intervention: {
        name: "Muscle Mass Increase",
        value: 5,
        unit: "lbs per person",
        populationSize: 10000
    },
    sections: [
        {
            title: "Metabolic Impact",
            metrics: metabolic,
            metricDefinitions: metabolicOutcomeMetrics
        },
        {
            title: "Health Outcomes",
            metrics: health,
            metricDefinitions: healthOutcomeMetrics
        },
        {
            title: "Economic Impact",
            metrics: economic,
            metricDefinitions: economicOutcomeMetrics
        }
    ]
};

const markdown = generateMarkdownReport(reportData);
*/ 