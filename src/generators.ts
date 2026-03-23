import { GenerateOptions, ZodResult, JSONSchemaResult, TypeScriptResult, AllFormatsResult } from './types'
import { zodPrompt, jsonSchemaPrompt, typeScriptPrompt } from './prompts'
import { extractCodeBlock, extractJSON } from './extract'
import { validateZod, validateJSONSchema, validateTypeScript } from './validate'
import { withRetry } from './retry'

export async function generateZod(description: string, options: GenerateOptions): Promise<ZodResult> {
  const { result, valid, attempts, attemptRecords } = await withRetry(
    async (attempt, lastErrors) => {
      const errorFeedback = lastErrors ? lastErrors.join('\n') : undefined
      const prompt = zodPrompt(description, errorFeedback)
      const response = await options.llm(prompt, options.signal)
      const code = extractCodeBlock(response, 'typescript') ?? extractCodeBlock(response) ?? response
      const { valid: v, errors } = validateZod(code)
      return { result: code, rawOutput: response, errors: v ? [] : errors }
    },
    { maxRetries: options.maxRetries ?? 3, signal: options.signal }
  )

  return {
    format: 'zod',
    code: result,
    valid,
    attempts,
    attemptRecords,
  }
}

export async function generateJSONSchema(description: string, options: GenerateOptions): Promise<JSONSchemaResult> {
  const { result, valid, attempts, attemptRecords } = await withRetry(
    async (attempt, lastErrors) => {
      const errorFeedback = lastErrors ? lastErrors.join('\n') : undefined
      const prompt = jsonSchemaPrompt(description, errorFeedback)
      const response = await options.llm(prompt, options.signal)
      const schema = extractJSON(response) ?? {}
      const { valid: v, errors } = validateJSONSchema(schema)
      return { result: schema, rawOutput: response, errors: v ? [] : errors }
    },
    { maxRetries: options.maxRetries ?? 3, signal: options.signal }
  )

  return {
    format: 'json-schema',
    schema: result,
    valid,
    attempts,
    attemptRecords,
  }
}

export async function generateTypeScript(description: string, options: GenerateOptions): Promise<TypeScriptResult> {
  const { result, valid, attempts, attemptRecords } = await withRetry(
    async (attempt, lastErrors) => {
      const errorFeedback = lastErrors ? lastErrors.join('\n') : undefined
      const prompt = typeScriptPrompt(description, errorFeedback)
      const response = await options.llm(prompt, options.signal)
      const declarations = extractCodeBlock(response, 'typescript') ?? extractCodeBlock(response) ?? response
      const { valid: v, errors } = validateTypeScript(declarations)
      return { result: declarations, rawOutput: response, errors: v ? [] : errors }
    },
    { maxRetries: options.maxRetries ?? 3, signal: options.signal }
  )

  return {
    format: 'typescript',
    declarations: result,
    valid,
    attempts,
    attemptRecords,
  }
}

export async function generateAll(description: string, options: GenerateOptions): Promise<AllFormatsResult> {
  const [zod, jsonSchema, typescript] = await Promise.all([
    generateZod(description, options),
    generateJSONSchema(description, options),
    generateTypeScript(description, options),
  ])
  return { format: 'all', zod, jsonSchema, typescript }
}
