export interface ValidationResult {
  valid: boolean
  errors: string[]
}

function hasBalancedDelimiters(code: string): boolean {
  let parens = 0
  let braces = 0
  let brackets = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < code.length; i++) {
    const ch = code[i]
    const prev = i > 0 ? code[i - 1] : ''

    if (inString) {
      if (ch === stringChar && prev !== '\\') inString = false
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true
      stringChar = ch
      continue
    }

    if (ch === '(') parens++
    else if (ch === ')') parens--
    else if (ch === '{') braces++
    else if (ch === '}') braces--
    else if (ch === '[') brackets++
    else if (ch === ']') brackets--
  }

  return parens === 0 && braces === 0 && brackets === 0 && !inString
}

export function validateZod(code: string): ValidationResult {
  const errors: string[] = []

  if (!code || code.trim().length === 0) {
    errors.push('Code is empty')
    return { valid: false, errors }
  }

  const trimmed = code.trim()

  // Must start with z. or a declaration keyword
  const validStart = /^(z\.|const |let |type |interface |import )/.test(trimmed)
  if (!validStart) {
    errors.push('Code must start with z., const, let, type, interface, or import')
  }

  // Must contain at least one Zod primitive or constructor
  const zodKeywords = ['z.object', 'z.string', 'z.number', 'z.array', 'z.union', 'z.boolean', 'z.enum', 'z.optional', 'z.literal', 'z.record', 'z.tuple']
  const hasZodKeyword = zodKeywords.some(kw => trimmed.includes(kw))
  if (!hasZodKeyword) {
    errors.push('Code must contain at least one Zod method (z.object, z.string, z.number, z.array, z.union, etc.)')
  }

  // Balanced delimiters
  if (!hasBalancedDelimiters(trimmed)) {
    errors.push('Code has unbalanced parentheses, braces, or brackets')
  }

  return { valid: errors.length === 0, errors }
}

const VALID_JSON_SCHEMA_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'])

export function validateJSONSchema(schema: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  if (!schema || typeof schema !== 'object') {
    errors.push('Schema must be a non-null object')
    return { valid: false, errors }
  }

  const hasStructure = 'type' in schema || '$schema' in schema || 'properties' in schema || 'anyOf' in schema || 'oneOf' in schema || 'allOf' in schema || '$ref' in schema
  if (!hasStructure) {
    errors.push('Schema must have at least one of: type, $schema, properties, anyOf, oneOf, allOf, $ref')
  }

  if ('type' in schema) {
    const t = schema['type']
    if (typeof t === 'string' && !VALID_JSON_SCHEMA_TYPES.has(t)) {
      errors.push(`Invalid JSON Schema type: "${t}". Must be one of: ${[...VALID_JSON_SCHEMA_TYPES].join(', ')}`)
    } else if (Array.isArray(t)) {
      for (const item of t) {
        if (typeof item !== 'string' || !VALID_JSON_SCHEMA_TYPES.has(item)) {
          errors.push(`Invalid JSON Schema type in array: "${item}"`)
        }
      }
    }
  }

  if ('properties' in schema && schema['properties'] !== null && typeof schema['properties'] === 'object') {
    const props = schema['properties'] as Record<string, unknown>
    for (const [key, val] of Object.entries(props)) {
      if (typeof val !== 'object' || val === null) {
        errors.push(`Property "${key}" must be an object`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateTypeScript(code: string): ValidationResult {
  const errors: string[] = []

  if (!code || code.trim().length === 0) {
    errors.push('Code is empty')
    return { valid: false, errors }
  }

  const trimmed = code.trim()

  // Must contain interface or type keyword
  const hasTypeDeclaration = /\binterface\b/.test(trimmed) || /\btype\b/.test(trimmed)
  if (!hasTypeDeclaration) {
    errors.push('Code must contain at least one interface or type declaration')
  }

  // Balanced braces
  if (!hasBalancedDelimiters(trimmed)) {
    errors.push('Code has unbalanced braces or brackets')
  }

  // No obvious unclosed template literals
  const backtickCount = (trimmed.match(/(?<!\\)`/g) || []).length
  if (backtickCount % 2 !== 0) {
    errors.push('Code has unclosed template literal (backtick)')
  }

  return { valid: errors.length === 0, errors }
}
