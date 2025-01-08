import { ModelConfig } from './types';
import { economicModel } from './models/economic-model/model';

export class ModelLoader {
  private models: Record<string, ModelConfig> = {};

  constructor() {
    this.registerModel(economicModel);
  }

  registerModel(model: ModelConfig) {
    if (this.models[model.id]) {
      throw new Error(`Model with id ${model.id} already exists`);
    }
    this.models[model.id] = model;
  }

  getModel(id: string): ModelConfig {
    const model = this.models[id];
    if (!model) {
      throw new Error(`Model with id ${id} not found`);
    }
    return model;
  }

  getAllModels(): ModelConfig[] {
    return Object.values(this.models);
  }

  validateModel(model: ModelConfig) {
    // Validate required fields
    if (!model.id || !model.title || !model.description) {
      throw new Error('Model is missing required fields');
    }

    // Validate parameters
    model.parameters.forEach(param => {
      if (!param.id || !param.displayName || param.defaultValue === undefined) {
        throw new Error(`Invalid parameter configuration in model ${model.id}`);
      }
    });

    // Validate metrics
    model.metrics.forEach(metric => {
      if (!metric.id || !metric.displayName || !metric.calculate) {
        throw new Error(`Invalid metric configuration in model ${model.id}`);
      }
    });
  }
}

export const modelLoader = new ModelLoader();
