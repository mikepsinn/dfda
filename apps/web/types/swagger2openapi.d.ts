declare module 'swagger2openapi' {
  interface ConvertOptions {
    patch?: boolean;
    warnOnly?: boolean;
    [key: string]: any; // Allow other options
  }

  interface ConvertResult {
    openapi: any;
    [key: string]: any; // Allow other results
  }

  function convert(spec: any, options: ConvertOptions): Promise<ConvertResult>;

  export { convert, ConvertOptions, ConvertResult };
} 