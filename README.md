# schema-from-text

Generate Zod schemas, JSON Schemas, and TypeScript type declarations from natural language descriptions using any LLM.

## Install

```bash
npm install schema-from-text
```

## Quick Start

```typescript
import { createGenerator } from 'schema-from-text'

// Provide any async function that calls your LLM
const mockLLM = async (prompt: string) => {
  // Replace with your actual LLM call, e.g. OpenAI, Anthropic, etc.
  return `\`\`\`typescript\nz.object({ name: z.string(), age: z.number() })\n\`\`\``
}

const generator = createGenerator({ llm: mockLLM })

const result = await generator.generateZod('A user with a name string and numeric age')
// result.format === 'zod'
// result.code  === 'z.object({ name: z.string(), age: z.number() })'
// result.valid === true
```

## API

### `createGenerator(config)`

Creates a reusable generator bound to a config.

```typescript
const generator = createGenerator({
  llm: myLLMFunction,   // required
  format: 'zod',        // optional, default 'zod'
  maxRetries: 3,        // optional, default 3
})
```

**Methods:**

- `generator.generate(description, options?)` — generate using config format
- `generator.generateZod(description, options?)` — always generate Zod schema
- `generator.generateJSONSchema(description, options?)` — always generate JSON Schema
- `generator.generateTypeScript(description, options?)` — always generate TypeScript declarations

### Standalone functions

```typescript
import { generateSchema, generateZod, generateJSONSchema, generateTypeScript } from 'schema-from-text'

// Zod
const zodResult = await generateZod('A product with name and price', { llm })
// zodResult.code === 'z.object({ name: z.string(), price: z.number() })'

// JSON Schema
const jsonResult = await generateJSONSchema('A product with name and price', { llm })
// jsonResult.schema === { type: 'object', properties: { name: { type: 'string' }, price: { type: 'number' } } }

// TypeScript
const tsResult = await generateTypeScript('A product with name and price', { llm })
// tsResult.declarations === 'interface Product { name: string; price: number }'

// All formats at once
const allResult = await generateSchema('A product', { llm, format: 'all' })
// allResult.zod, allResult.jsonSchema, allResult.typescript
```

## Output Format

Each result contains:

| Field | Description |
|---|---|
| `format` | `'zod'`, `'json-schema'`, or `'typescript'` |
| `valid` | Whether heuristic validation passed |
| `attempts` | Number of LLM calls made |
| `attemptRecords` | Array of `{ attempt, rawOutput, validated, errors? }` |
| `code` / `schema` / `declarations` | The generated output |

## Retry Loop

The library automatically retries up to `maxRetries` times (default 3). On each retry, the validation errors from the previous attempt are fed back to the LLM as feedback, improving the output.

## LLMFunction Type

```typescript
type LLMFunction = (prompt: string, signal?: AbortSignal) => Promise<string>
```

Pass an `AbortSignal` via options to cancel in-flight requests.

## License

MIT
