export function zodPrompt(description: string, errorFeedback?: string): string {
  const retry = errorFeedback
    ? `\nPrevious attempt failed with: ${errorFeedback}. Please fix.\n`
    : ''
  return `Generate a Zod schema for the following description:

${description}
${retry}
Return ONLY the Zod schema code, wrapped in \`\`\`typescript ... \`\`\` fences.

Example:
\`\`\`typescript
z.object({ name: z.string(), age: z.number() })
\`\`\`

Use z.object, z.string, z.number, z.array, z.boolean, z.union, z.optional, etc. as appropriate.
Do not include import statements or variable declarations unless necessary.`
}

export function jsonSchemaPrompt(description: string, errorFeedback?: string): string {
  const retry = errorFeedback
    ? `\nPrevious attempt failed with: ${errorFeedback}. Please fix.\n`
    : ''
  return `Generate a JSON Schema (draft-07) for the following description:

${description}
${retry}
Return ONLY valid JSON inside \`\`\`json ... \`\`\` fences.

Example:
\`\`\`json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" }
  },
  "required": ["name"]
}
\`\`\`

Use draft-07 JSON Schema format with proper type annotations.`
}

export function typeScriptPrompt(description: string, errorFeedback?: string): string {
  const retry = errorFeedback
    ? `\nPrevious attempt failed with: ${errorFeedback}. Please fix.\n`
    : ''
  return `Generate TypeScript interface/type declarations for the following description:

${description}
${retry}
Return ONLY TypeScript type declarations inside \`\`\`typescript ... \`\`\` fences.

Example:
\`\`\`typescript
interface User {
  name: string
  age: number
}
\`\`\`

Use interface or type keyword as appropriate. Do not include implementation code.`
}
