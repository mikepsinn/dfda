import { BaseModel } from './models/base/BaseModel';
import { BaseParameter } from './models/base/BaseParameter';
import { OutcomeMetric } from './models/base/OutcomeMetric';

export function loadModel(id: string): BaseModel {
  // TODO: Implement dynamic model loading
  throw new Error(`Model ${id} not found`);
}

export function validateModel(model: BaseModel): void {
  // Validate model structure
  if (!model.id || !model.title || !model.description || !model.version) {
    throw new Error('Model missing required fields');
  }

  // Validate parameters
  if (!model.parameters || !Array.isArray(model.parameters)) {
    throw new Error('Model must have parameters array');
  }

  model.parameters.forEach((param: BaseParameter) => {
    if (!param.id || !param.displayName || param.defaultValue === undefined) {
      throw new Error(`Invalid parameter: ${param.id}`);
    }
  });

  // Validate metrics
  if (!model.metrics || !Array.isArray(model.metrics)) {
    throw new Error('Model must have metrics array');
  }

  model.metrics.forEach((metric: OutcomeMetric) => {
    if (!metric.id || !metric.displayName || !metric.calculate) {
      throw new Error(`Invalid metric: ${metric.id}`);
    }
  });
}
