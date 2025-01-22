import { 
  InputParameter,
  OutcomeMetric,
  PopulationInterventionModel,
  type PopulationModelMetadata
} from '../../../src/models/base';

class FatMassReductionInputParameter extends InputParameter {
  constructor(
    id: string,
    displayName: string,
    value: number,
    unitName: string,
    description: string,
    emoji: string
  ) {
    super(id, displayName, value, unitName, description, emoji);
  }
}

class FatMassReductionOutcomeMetric extends OutcomeMetric {
  constructor(
    id: string,
    displayName: string,
    description: string,
    unitName: string,
    emoji: string,
    parameters: InputParameter[]
  ) {
    super(id, displayName, description, unitName, emoji, parameters);
  }

  calculate(): number {
    const caloriesPerPound = this.getParameterValue('calories-per-pound');
    const calorieDeficit = this.getParameterValue('calorie-deficit');
    return calorieDeficit / caloriesPerPound;
  }
}

export class TwoPoundFatMassReductionModel extends PopulationInterventionModel {
  constructor() {
    const metadata: PopulationModelMetadata = {
      interventionType: 'health',
      populationDescription: 'Adults aiming to reduce body fat',
      timeHorizon: '12 weeks',
      geographicScope: 'United States',
      assumptions: [
        '3500 calorie deficit results in 1 lb fat loss',
        'Linear relationship between calorie deficit and fat loss',
        'No significant changes in lean body mass'
      ]
    };

    const parameters = [
      new FatMassReductionInputParameter(
        'calories-per-pound',
        'Calories per Pound',
        3500,
        'calories',
        'Number of calories needed to burn to lose 1 pound of fat',
        '🔥'
      ),
      new FatMassReductionInputParameter(
        'calorie-deficit',
        'Daily Calorie Deficit',
        500,
        'calories/day',
        'Daily calorie deficit to achieve fat loss',
        '🍽️'
      )
    ];

    const metrics = [
      new FatMassReductionOutcomeMetric(
        'fat-loss',
        'Projected Fat Loss',
        'Calculates projected fat loss based on calorie deficit',
        'pounds',
        '🏋️',
        parameters
      )
    ];

    super(
      '2lb-fat-mass-reduction',
      '2 Pound Fat Mass Reduction Model',
      'A model for calculating fat mass reduction over time based on calorie deficit',
      '1.0.0',
      parameters,
      metrics,
      metadata
    );
  }
}