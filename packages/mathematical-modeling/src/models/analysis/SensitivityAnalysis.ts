export interface ParameterSensitivity {
  id: string;
  displayName: string;
  baseValue: number;
}

export interface SensitivityAnalysis {
  baseValue: number;
  sensitivities: Record<string, number[]>;
  parameters: ParameterSensitivity[];
  metadata?: Record<string, unknown>;
} 