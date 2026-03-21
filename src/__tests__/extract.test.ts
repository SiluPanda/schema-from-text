import { describe, it, expect } from 'vitest'
import { extractCodeBlock, extractJSON } from '../extract'

describe('extractCodeBlock', () => {
  it('finds typescript-fenced block', () => {
    const response = 'Here is the schema:\n```typescript\nz.object({ name: z.string() })\n```'
    expect(extractCodeBlock(response, 'typescript')).toBe('z.object({ name: z.string() })')
  })

  it('finds generic fenced block when no lang specified', () => {
    const response = 'Result:\n```\nsome code here\n```'
    expect(extractCodeBlock(response)).toBe('some code here')
  })

  it('falls back to generic fence when lang-specific not found', () => {
    // When a lang is passed but no lang-tagged fence exists, fall back to generic
    const response = '```\ngeneric code\n```'
    expect(extractCodeBlock(response, 'typescript')).toBe('generic code')
    expect(extractCodeBlock(response)).toBe('generic code')
  })

  it('returns null when no fence present', () => {
    expect(extractCodeBlock('no fences here')).toBe(null)
  })

  it('trims whitespace from extracted content', () => {
    const response = '```typescript\n  z.string()  \n```'
    expect(extractCodeBlock(response, 'typescript')).toBe('z.string()')
  })

  it('falls back to generic fence if lang-specific not found (code content)', () => {
    const response = '```\nz.string()\n```'
    // lang-specific not present; falls back to generic fence
    expect(extractCodeBlock(response, 'typescript')).toBe('z.string()')
    expect(extractCodeBlock(response)).toBe('z.string()')
  })
})

describe('extractJSON', () => {
  it('parses JSON from ```json fence', () => {
    const response = '```json\n{"type":"object","properties":{"name":{"type":"string"}}}\n```'
    const result = extractJSON(response)
    expect(result).not.toBeNull()
    expect(result?.['type']).toBe('object')
  })

  it('parses JSON from bare object in text', () => {
    const response = 'Here is your schema: {"type": "object", "properties": {}}'
    const result = extractJSON(response)
    expect(result).not.toBeNull()
    expect(result?.['type']).toBe('object')
  })

  it('returns null for non-parseable text', () => {
    expect(extractJSON('no json here at all')).toBeNull()
  })

  it('handles nested JSON correctly', () => {
    const response = '```json\n{"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"id":{"type":"number"}}}\n```'
    const result = extractJSON(response)
    expect(result?.['$schema']).toBe('http://json-schema.org/draft-07/schema#')
  })
})
