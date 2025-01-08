export abstract class BaseParameter {
  constructor(
    readonly id: string,
    readonly displayName: string,
    readonly defaultValue: number,
    readonly unitName: string,
    readonly description: string,
    readonly sourceUrl: string,
    readonly emoji: string,
    readonly sourceQuote?: string,
    readonly tags?: string[],
    readonly metadata?: Record<string, unknown>
  ) {}

  abstract generateDisplayValue(value: number): string;
  abstract validate(value: number): boolean;
} 