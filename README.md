# schema-from-text

Generate Zod schemas, JSON Schemas, and TypeScript type declarations from natural language descriptions using any LLM.

[![npm version](https://img.shields.io/npm/v/schema-from-text.svg)](https://www.npmjs.com/package/schema-from-text)
[![license](https://img.shields.io/npm/l/schema-from-text.svg)](https://github.com/SiluPanda/schema-from-text/blob/master/LICENSE)
[![node](https://img.shields.io/node/v/schema-from-text.svg)](https://nodejs.org)

---

## Description

`schema-from-text` is a code generation library that takes a natural language description of a data structure and produces validated output in three schema formats: Zod code, JSON Schema (draft-07), and TypeScript type declarations. It is provider-agnostic -- you supply any async function that calls your LLM of choice (OpenAI, Anthropic, Google, Mistral, Ollama, or any custom inference server). The library constructs optimized prompts, parses the LLM response, extracts code from markdown fences, validates the output with format-specific heuristics, and retries with error feedback when validation fails.

Typical use cases include defining tool parameter schemas for function calling (OpenAI, Anthropic, MCP), generating validation schemas for forms and API contracts, bootstrapping TypeScript types for data models, and rapid prototyping where hand-writing schemas is too slow.

---

## Installation

```bash
npm install schema-from-text
```

Requires Node.js >= 18.

---

## Quick Start

```typescript
import { generateZod } from 'schema-from-text'

// Provide any async function that calls your LLM
const llm = async (prompt: string): Promise<string> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await response.json()
  return data.choices[0].message.content
}

const result = await generateZod(
  'A user with name (string), email (valid email), and optional age (number, 0-150)',
  { llm }
)

console.log(result.format) // 'zod'
console.log(result.code)   // 'z.object({ name: z.string(), email: z.string().email(), age: z.number().min(0).max(150).optional() })'
console.log(result.valid)  // true
```

---

## Features

- **Three output formats** -- Generate Zod code strings, JSON Schema objects, or TypeScript interface/type declarations from a single natural language description.
- **Provider-agnostic** -- Works with any LLM through a simple `(prompt: string) => Promise<string>` function interface. No dependency on any provider SDK.
- **Automatic retry with error feedback** -- When generated output fails validation, the library retries up to a configurable number of times, feeding validation errors back to the LLM to improve subsequent attempts.
- **Format-specific validation** -- Each output format has dedicated validators: Zod code is checked for valid method calls, balanced delimiters, and required keywords; JSON Schema is checked for valid types, structural correctness, and property definitions; TypeScript is checked for declaration keywords and balanced braces.
- **Robust output extraction** -- Extracts code from markdown fences (`typescript`, `json`, or bare fences), parses JSON from surrounding prose using bracket matching, and handles common LLM response patterns.
- **Generate all formats at once** -- Use `format: 'all'` to produce Zod, JSON Schema, and TypeScript output in parallel from a single description.
- **Factory pattern** -- `createGenerator` returns a reusable generator instance with bound configuration, avoiding repeated setup of the LLM function and options.
- **AbortSignal support** -- Pass an `AbortSignal` to cancel in-flight LLM requests.
- **Full attempt history** -- Every result includes detailed records of each attempt, including raw LLM output, validation status, and any errors encountered.
- **Zero runtime dependencies** -- The package has no runtime dependencies. All dev dependencies (TypeScript, vitest, eslint) are build-time only.

---

## API Reference

### `generateSchema(description, options)`

Unified entry point that delegates to the format-specific generator based on `options.format`.

```typescript
import { generateSchema } from 'schema-from-text'

// Defaults to Zod format
const result = await generateSchema('A product with name and price', { llm })

// Specify format explicitly
const jsonResult = await generateSchema('A product with name and price', {
  llm,
  format: 'json-schema',
})

// Generate all formats in parallel
const allResult = await generateSchema('A product with name and price', {
  llm,
  format: 'all',
})
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `description` | `string` | Natural language description of the data structure. |
| `options` | `GenerateOptions` | Configuration object (see [GenerateOptions](#generateoptions)). |

**Returns:** `Promise<SchemaResult>` -- A `ZodResult`, `JSONSchemaResult`, `TypeScriptResult`, or `AllFormatsResult` depending on the `format` option.

---

### `generateZod(description, options)`

Generates a Zod schema code string from a natural language description.

```typescript
import { generateZod } from 'schema-from-text'

const result = await generateZod(
  'A blog post with title, body, tags array, and published boolean',
  { llm }
)

console.log(result.format)         // 'zod'
console.log(result.code)           // 'z.object({ title: z.string(), body: z.string(), ... })'
console.log(result.valid)          // true
console.log(result.attempts)       // 1
console.log(result.attemptRecords) // [{ attempt: 1, rawOutput: '...', validated: true }]
```

**Returns:** `Promise<ZodResult>`

---

### `generateJSONSchema(description, options)`

Generates a JSON Schema object (draft-07) from a natural language description.

```typescript
import { generateJSONSchema } from 'schema-from-text'

const result = await generateJSONSchema(
  'A product with name (string), price (number), and category (one of electronics, clothing, books)',
  { llm }
)

console.log(result.format) // 'json-schema'
console.log(result.schema) // { type: 'object', properties: { ... }, ... }
console.log(result.valid)  // true
```

**Returns:** `Promise<JSONSchemaResult>`

---

### `generateTypeScript(description, options)`

Generates TypeScript interface or type declarations from a natural language description.

```typescript
import { generateTypeScript } from 'schema-from-text'

const result = await generateTypeScript(
  'A config with host (string), port (number), and debug (boolean, optional)',
  { llm }
)

console.log(result.format)       // 'typescript'
console.log(result.declarations) // 'interface Config {\n  host: string\n  port: number\n  debug?: boolean\n}'
console.log(result.valid)        // true
```

**Returns:** `Promise<TypeScriptResult>`

---

### `createGenerator(config)`

Factory function that returns a reusable `SchemaGenerator` instance with bound configuration. Per-call options override the factory defaults.

```typescript
import { createGenerator } from 'schema-from-text'

const generator = createGenerator({
  llm: myLLMFunction,
  format: 'zod',
  maxRetries: 5,
})

// Use the bound config
const result = await generator.generateZod('A user with name and email')

// Override format for a single call
const jsonResult = await generator.generateJSONSchema('A user with name and email')

// Use the generic generate method (dispatches based on config format)
const autoResult = await generator.generate('A user with name and email')
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `config` | `GeneratorConfig` | Default configuration (see [GeneratorConfig](#generatorconfig)). |

**Returns:** `SchemaGenerator`

#### `SchemaGenerator` interface

| Method | Return Type | Description |
|---|---|---|
| `generate(description, options?)` | `Promise<SchemaResult>` | Generate using the configured format (or override with `options.format`). |
| `generateZod(description, options?)` | `Promise<ZodResult>` | Always generate Zod code. |
| `generateJSONSchema(description, options?)` | `Promise<JSONSchemaResult>` | Always generate JSON Schema. |
| `generateTypeScript(description, options?)` | `Promise<TypeScriptResult>` | Always generate TypeScript declarations. |
| `config` | `GeneratorConfig` (readonly) | The bound configuration object. |

---

## Configuration

### `GenerateOptions`

| Property | Type | Default | Description |
|---|---|---|---|
| `llm` | `LLMFunction` | (required) | Async function that calls the LLM and returns the raw text response. |
| `format` | `OutputFormat` | `'zod'` | Output format: `'zod'`, `'json-schema'`, `'typescript'`, or `'all'`. |
| `maxRetries` | `number` | `3` | Maximum number of LLM calls before returning the best result. |
| `signal` | `AbortSignal` | `undefined` | Signal to cancel in-flight LLM requests. |

### `GeneratorConfig`

Used with `createGenerator` to bind default options.

| Property | Type | Default | Description |
|---|---|---|---|
| `llm` | `LLMFunction` | (required) | Async function that calls the LLM. |
| `format` | `OutputFormat` | `'zod'` | Default output format. |
| `maxRetries` | `number` | `3` | Default maximum retries. |

### `LLMFunction`

```typescript
type LLMFunction = (prompt: string, signal?: AbortSignal) => Promise<string>
```

The library constructs the full prompt internally and passes it to this function. The function must return the raw text response from the LLM. The optional `signal` parameter allows cooperative cancellation.

### `OutputFormat`

```typescript
type OutputFormat = 'zod' | 'json-schema' | 'typescript' | 'all'
```

---

## Error Handling

### Validation Failures and Retries

When the LLM produces output that fails validation, the library automatically retries. On each retry, the validation errors from the previous attempt are included in the prompt so the LLM can self-correct. After exhausting all retries, the result is returned with `valid: false` and the full attempt history.

```typescript
const result = await generateZod('A complex nested schema', {
  llm,
  maxRetries: 5,
})

if (!result.valid) {
  console.error('Generation failed after', result.attempts, 'attempts')
  for (const record of result.attemptRecords) {
    if (!record.validated) {
      console.error(`Attempt ${record.attempt} errors:`, record.errors)
    }
  }
}
```

### AbortSignal Cancellation

Pass an `AbortSignal` to cancel generation. If the signal is aborted before or during an LLM call, an `Error` with the message `'Operation aborted'` is thrown.

```typescript
const controller = new AbortController()

// Cancel after 10 seconds
setTimeout(() => controller.abort(), 10_000)

try {
  const result = await generateZod('A user schema', {
    llm,
    signal: controller.signal,
  })
} catch (err) {
  if (err.message === 'Operation aborted') {
    console.log('Generation was cancelled')
  }
}
```

### LLM Function Errors

If the provided `llm` function throws an error (network failure, API rate limit, authentication error), that error propagates directly to the caller. The library does not catch or wrap LLM function errors -- only validation failures trigger retries.

---

## Advanced Usage

### Generating All Formats at Once

Use `format: 'all'` to produce Zod, JSON Schema, and TypeScript output in parallel from a single description. This makes three concurrent LLM calls.

```typescript
import { generateSchema } from 'schema-from-text'

const result = await generateSchema(
  'An order with orderId (UUID), items array (each with productId, quantity, unitPrice), and status enum (pending, shipped, delivered)',
  { llm, format: 'all' }
)

// result.zod.code        -- Zod code string
// result.jsonSchema.schema -- JSON Schema object
// result.typescript.declarations -- TypeScript declarations
```

### Using with OpenAI

```typescript
import OpenAI from 'openai'
import { createGenerator } from 'schema-from-text'

const openai = new OpenAI()

const llm = async (prompt: string, signal?: AbortSignal): Promise<string> => {
  const response = await openai.chat.completions.create(
    { model: 'gpt-4o', messages: [{ role: 'user', content: prompt }] },
    { signal }
  )
  return response.choices[0].message.content ?? ''
}

const generator = createGenerator({ llm })
const result = await generator.generateZod('A user with name, email, and role enum (admin, user, guest)')
```

### Using with Anthropic

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { createGenerator } from 'schema-from-text'

const anthropic = new Anthropic()

const llm = async (prompt: string, signal?: AbortSignal): Promise<string> => {
  const response = await anthropic.messages.create(
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    },
    { signal }
  )
  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}

const generator = createGenerator({ llm, maxRetries: 4 })
const result = await generator.generateJSONSchema('A product catalog entry with name, price, SKU, and category')
```

### Using with Ollama (Local Models)

```typescript
import { generateZod } from 'schema-from-text'

const llm = async (prompt: string): Promise<string> => {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama3', prompt }),
  })
  const data = await response.json()
  return data.response
}

const result = await generateZod('A todo item with title, completed boolean, and priority enum (low, medium, high)', { llm })
```

### Inspecting Attempt Records

Every result includes a detailed history of each attempt, useful for debugging prompt quality or LLM behavior.

```typescript
const result = await generateZod('A complex schema', { llm, maxRetries: 3 })

for (const record of result.attemptRecords) {
  console.log(`Attempt ${record.attempt}:`)
  console.log(`  Validated: ${record.validated}`)
  console.log(`  Raw output: ${record.rawOutput.slice(0, 100)}...`)
  if (record.errors) {
    console.log(`  Errors: ${record.errors.join(', ')}`)
  }
}
```

---

## TypeScript

This package is written in TypeScript and ships with full type declarations. All public types are exported from the package entry point.

```typescript
import type {
  LLMFunction,
  OutputFormat,
  GenerateOptions,
  GeneratorConfig,
  SchemaGenerator,
  SchemaResult,
  ZodResult,
  JSONSchemaResult,
  TypeScriptResult,
  AllFormatsResult,
  AttemptRecord,
} from 'schema-from-text'
```

### Result Types

**`ZodResult`**

```typescript
interface ZodResult {
  format: 'zod'
  code: string                    // The generated Zod code string
  valid: boolean                  // Whether the output passed validation
  attempts: number                // Total number of LLM calls made
  attemptRecords: AttemptRecord[] // Detailed history of each attempt
}
```

**`JSONSchemaResult`**

```typescript
interface JSONSchemaResult {
  format: 'json-schema'
  schema: Record<string, unknown> // The parsed JSON Schema object
  valid: boolean
  attempts: number
  attemptRecords: AttemptRecord[]
}
```

**`TypeScriptResult`**

```typescript
interface TypeScriptResult {
  format: 'typescript'
  declarations: string            // The generated TypeScript declarations
  valid: boolean
  attempts: number
  attemptRecords: AttemptRecord[]
}
```

**`AllFormatsResult`**

```typescript
interface AllFormatsResult {
  zod: ZodResult
  jsonSchema: JSONSchemaResult
  typescript: TypeScriptResult
}
```

**`AttemptRecord`**

```typescript
interface AttemptRecord {
  attempt: number     // 1-indexed attempt number
  rawOutput: string   // The raw LLM response text
  validated: boolean  // Whether this attempt passed validation
  errors?: string[]   // Validation errors (present when validated is false)
}
```

---

## License

MIT
