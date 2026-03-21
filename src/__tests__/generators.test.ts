import { describe, it, expect, vi } from 'vitest'
import { generateZod, generateJSONSchema, generateTypeScript, createGenerator } from '../index'

const validZodResponse = '```typescript\nz.object({ name: z.string(), age: z.number() })\n```'
const validJSONSchemaResponse = '```json\n{"type":"object","properties":{"name":{"type":"string"}}}\n```'
const validTypeScriptResponse = '```typescript\ninterface User {\n  name: string\n  age: number\n}\n```'

describe('generateZod', () => {
  it('returns ZodResult with valid=true when LLM returns valid code', async () => {
    const llm = vi.fn().mockResolvedValue(validZodResponse)
    const result = await generateZod('A user with name and age', { llm })
    expect(result.format).toBe('zod')
    expect(result.valid).toBe(true)
    expect(result.code).toContain('z.object')
    expect(result.attempts).toBe(1)
    expect(result.attemptRecords).toHaveLength(1)
    expect(result.attemptRecords[0].validated).toBe(true)
  })

  it('retries when LLM first returns bad code then good code (attempts=2)', async () => {
    const badResponse = 'some random text without zod'
    const llm = vi.fn()
      .mockResolvedValueOnce(badResponse)
      .mockResolvedValueOnce(validZodResponse)

    const result = await generateZod('A product schema', { llm, maxRetries: 3 })
    expect(result.attempts).toBe(2)
    expect(result.valid).toBe(true)
    expect(llm).toHaveBeenCalledTimes(2)
    expect(result.attemptRecords[0].validated).toBe(false)
    expect(result.attemptRecords[1].validated).toBe(true)
  })

  it('returns valid=false after exhausting maxRetries', async () => {
    const llm = vi.fn().mockResolvedValue('not valid zod code at all')
    const result = await generateZod('anything', { llm, maxRetries: 2 })
    expect(result.valid).toBe(false)
    expect(result.attempts).toBe(2)
    expect(llm).toHaveBeenCalledTimes(2)
  })

  it('passes error feedback to subsequent LLM calls', async () => {
    const llm = vi.fn()
      .mockResolvedValueOnce('not valid')
      .mockResolvedValueOnce(validZodResponse)

    await generateZod('A schema', { llm, maxRetries: 3 })
    // Second call should include error feedback in prompt
    const secondCallPrompt = llm.mock.calls[1][0] as string
    expect(secondCallPrompt).toContain('Previous attempt failed with')
  })
})

describe('generateJSONSchema', () => {
  it('returns JSONSchemaResult with valid=true for valid response', async () => {
    const llm = vi.fn().mockResolvedValue(validJSONSchemaResponse)
    const result = await generateJSONSchema('An object with a name string', { llm })
    expect(result.format).toBe('json-schema')
    expect(result.valid).toBe(true)
    expect(result.schema).toHaveProperty('type', 'object')
    expect(result.attempts).toBe(1)
  })

  it('retries on invalid JSON response', async () => {
    const llm = vi.fn()
      .mockResolvedValueOnce('not json at all')
      .mockResolvedValueOnce(validJSONSchemaResponse)

    const result = await generateJSONSchema('A schema', { llm, maxRetries: 3 })
    expect(result.valid).toBe(true)
    expect(result.attempts).toBe(2)
  })
})

describe('generateTypeScript', () => {
  it('returns TypeScriptResult with valid=true for valid response', async () => {
    const llm = vi.fn().mockResolvedValue(validTypeScriptResponse)
    const result = await generateTypeScript('A user entity', { llm })
    expect(result.format).toBe('typescript')
    expect(result.valid).toBe(true)
    expect(result.declarations).toContain('interface User')
    expect(result.attempts).toBe(1)
  })
})

describe('createGenerator', () => {
  it('factory creates generator with bound config', async () => {
    const llm = vi.fn().mockResolvedValue(validZodResponse)
    const generator = createGenerator({ llm, format: 'zod', maxRetries: 2 })

    expect(generator.config.llm).toBe(llm)
    expect(generator.config.format).toBe('zod')

    const result = await generator.generateZod('A user schema')
    expect(result.format).toBe('zod')
    expect(result.valid).toBe(true)
  })

  it('generate() dispatches to correct format', async () => {
    const llm = vi.fn().mockResolvedValue(validZodResponse)
    const generator = createGenerator({ llm })

    const result = await generator.generate('A schema', { format: 'zod' })
    expect('code' in result).toBe(true)
  })

  it('generateJSONSchema method works', async () => {
    const llm = vi.fn().mockResolvedValue(validJSONSchemaResponse)
    const generator = createGenerator({ llm })
    const result = await generator.generateJSONSchema('An object')
    expect(result.format).toBe('json-schema')
  })

  it('generateTypeScript method works', async () => {
    const llm = vi.fn().mockResolvedValue(validTypeScriptResponse)
    const generator = createGenerator({ llm })
    const result = await generator.generateTypeScript('A user entity')
    expect(result.format).toBe('typescript')
  })
})
