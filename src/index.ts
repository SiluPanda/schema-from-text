// schema-from-text - Generate Zod schemas from natural language descriptions
import {
  generateZod as _generateZod,
  generateJSONSchema as _generateJSONSchema,
  generateTypeScript as _generateTypeScript,
  generateAll,
} from './generators'

import type {
  GenerateOptions,
  GeneratorConfig,
  SchemaGenerator,
  SchemaResult,
  ZodResult,
  JSONSchemaResult,
  TypeScriptResult,
} from './types'

export async function generateSchema(description: string, options: GenerateOptions): Promise<SchemaResult> {
  const format = options.format ?? 'zod'
  if (format === 'all') return generateAll(description, options)
  if (format === 'zod') return _generateZod(description, options)
  if (format === 'json-schema') return _generateJSONSchema(description, options)
  return _generateTypeScript(description, options)
}

export async function generateZod(description: string, options: GenerateOptions): Promise<ZodResult> {
  return _generateZod(description, options)
}

export async function generateJSONSchema(description: string, options: GenerateOptions): Promise<JSONSchemaResult> {
  return _generateJSONSchema(description, options)
}

export async function generateTypeScript(description: string, options: GenerateOptions): Promise<TypeScriptResult> {
  return _generateTypeScript(description, options)
}

export function createGenerator(config: GeneratorConfig): SchemaGenerator {
  return {
    generate: (desc, opts) => generateSchema(desc, { ...config, ...opts } as GenerateOptions),
    generateZod: (desc, opts) => generateZod(desc, { ...config, ...opts } as GenerateOptions),
    generateJSONSchema: (desc, opts) => generateJSONSchema(desc, { ...config, ...opts } as GenerateOptions),
    generateTypeScript: (desc, opts) => generateTypeScript(desc, { ...config, ...opts } as GenerateOptions),
    config,
  }
}

export * from './types'
