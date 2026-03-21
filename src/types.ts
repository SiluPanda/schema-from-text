export type LLMFunction = (prompt: string, signal?: AbortSignal) => Promise<string>
export type OutputFormat = 'zod' | 'json-schema' | 'typescript' | 'all'

export interface GenerateOptions {
  llm: LLMFunction
  format?: OutputFormat   // default 'zod'
  maxRetries?: number     // default 3
  signal?: AbortSignal
}

export interface AttemptRecord {
  attempt: number
  rawOutput: string
  validated: boolean
  errors?: string[]
}

export interface ZodResult {
  format: 'zod'
  code: string
  valid: boolean
  attempts: number
  attemptRecords: AttemptRecord[]
}

export interface JSONSchemaResult {
  format: 'json-schema'
  schema: Record<string, unknown>
  valid: boolean
  attempts: number
  attemptRecords: AttemptRecord[]
}

export interface TypeScriptResult {
  format: 'typescript'
  declarations: string
  valid: boolean
  attempts: number
  attemptRecords: AttemptRecord[]
}

export interface AllFormatsResult {
  zod: ZodResult
  jsonSchema: JSONSchemaResult
  typescript: TypeScriptResult
}

export type SchemaResult = ZodResult | JSONSchemaResult | TypeScriptResult | AllFormatsResult

export interface GeneratorConfig {
  llm: LLMFunction
  format?: OutputFormat
  maxRetries?: number
}

export interface SchemaGenerator {
  generate(description: string, options?: Partial<GenerateOptions>): Promise<SchemaResult>
  generateZod(description: string, options?: Partial<GenerateOptions>): Promise<ZodResult>
  generateJSONSchema(description: string, options?: Partial<GenerateOptions>): Promise<JSONSchemaResult>
  generateTypeScript(description: string, options?: Partial<GenerateOptions>): Promise<TypeScriptResult>
  readonly config: GeneratorConfig
}
