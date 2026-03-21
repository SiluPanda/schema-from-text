import { describe, it, expect } from 'vitest'
import { validateZod, validateJSONSchema, validateTypeScript } from '../validate'

describe('validateZod', () => {
  it('passes valid z.object code', () => {
    const result = validateZod('z.object({ name: z.string(), age: z.number() })')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('passes z.object with const assignment', () => {
    const result = validateZod('const schema = z.object({ id: z.number(), active: z.boolean() })')
    expect(result.valid).toBe(true)
  })

  it('fails on empty string', () => {
    const result = validateZod('')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('fails when no Zod keyword present', () => {
    const result = validateZod('const schema = { name: "string" }')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Zod method'))).toBe(true)
  })

  it('fails on unbalanced parentheses', () => {
    const result = validateZod('z.object({ name: z.string()')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('unbalanced'))).toBe(true)
  })

  it('passes z.array schema', () => {
    const result = validateZod('z.array(z.string())')
    expect(result.valid).toBe(true)
  })

  it('passes z.union schema', () => {
    const result = validateZod('z.union([z.string(), z.number()])')
    expect(result.valid).toBe(true)
  })
})

describe('validateJSONSchema', () => {
  it('passes valid schema with type and properties', () => {
    const schema = {
      '$schema': 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: { name: { type: 'string' } },
    }
    const result = validateJSONSchema(schema)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('passes schema with only type field', () => {
    const result = validateJSONSchema({ type: 'string' })
    expect(result.valid).toBe(true)
  })

  it('passes schema with only $schema field', () => {
    const result = validateJSONSchema({ '$schema': 'http://json-schema.org/draft-07/schema#' })
    expect(result.valid).toBe(true)
  })

  it('fails when schema has no recognized structure fields', () => {
    const result = validateJSONSchema({ foo: 'bar' })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('fails when type is invalid', () => {
    const result = validateJSONSchema({ type: 'invalid-type' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Invalid JSON Schema type'))).toBe(true)
  })

  it('fails when property value is not an object', () => {
    const result = validateJSONSchema({ type: 'object', properties: { name: 'string' as unknown as object } })
    expect(result.valid).toBe(false)
  })
})

describe('validateTypeScript', () => {
  it('passes valid interface declaration', () => {
    const result = validateTypeScript('interface User {\n  name: string\n  age: number\n}')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('passes valid type alias', () => {
    const result = validateTypeScript('type User = { name: string; age: number }')
    expect(result.valid).toBe(true)
  })

  it('fails on empty string', () => {
    const result = validateTypeScript('')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('fails when no interface or type keyword', () => {
    const result = validateTypeScript('const x = 1')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('interface or type'))).toBe(true)
  })

  it('fails on unbalanced braces', () => {
    const result = validateTypeScript('interface Foo { name: string')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('unbalanced'))).toBe(true)
  })
})
