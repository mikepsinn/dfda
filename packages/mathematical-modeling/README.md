# Mathematical Modeling Package

## Overview

A generalized mathematical modeling framework for simulating population-level interventions and their outcomes. This package provides a flexible, extensible architecture for creating and running mathematical models across various domains, with a particular focus on health economics and population-level interventions.

## Core Features

- **Abstract Model Framework**
  - Base classes for model elements and parameters
  - Extensible outcome metric system
  - Population intervention modeling capabilities

- **Input Parameter Management**
  - Type-safe parameter definitions
  - Parameter validation and constraints
  - Sensitivity analysis support

- **Outcome Metrics**
  - Customizable metric definitions
  - Multi-dimensional outcome tracking
  - Aggregation and statistical analysis

- **Population Models**
  - Population segmentation and stratification
  - Demographic-specific interventions
  - Temporal evolution tracking

## Usage

```typescript
import { PopulationInterventionModel, InputParameter, OutcomeMetric } from '@dfda/mathematical-modeling';

// Define your model parameters
const parameters = [
  new InputParameter({
    name: 'interventionEffectSize',
    defaultValue: 0.5,
    min: 0,
    max: 1
  })
];

// Create outcome metrics
const metrics = [
  new OutcomeMetric({
    name: 'costSavings',
    unit: 'USD',
    aggregationType: 'sum'
  })
];

// Implement your model
class MyInterventionModel extends PopulationInterventionModel {
  // Model implementation
}
```

## Planned Enhancements

Based on functionality from the health-econ-simulation package, the following enhancements are planned:

1. **Economic Impact Models**
   - Healthcare cost calculations
   - GDP impact assessment
   - Budget impact analysis
   - Cost-effectiveness ratios (ICER, ROI)

2. **Health Outcome Models**
   - Quality-adjusted life years (QALYs)
   - Life years gained (LYG)
   - Disease progression models
   - Mortality rate impacts

3. **Productivity Models**
   - Workforce participation impact
   - Absenteeism calculations
   - Disability rate modeling

4. **Analysis Tools**
   - Sensitivity analysis framework
   - Scenario generation
   - Sub-population analysis
   - Monte Carlo simulation support

5. **Specific Disease Models**
   - Alzheimer's progression
   - Obesity-related conditions
   - Kidney disease
   - Generic disease template

## Contributing

Contributions are welcome! Please see our contributing guidelines for more information.

## License

[License Type] - See LICENSE file for details 