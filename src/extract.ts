export function extractCodeBlock(response: string, lang?: string): string | null {
  // Try lang-specific fence first
  if (lang) {
    const langRegex = new RegExp('```' + lang + '\\s*\\n([\\s\\S]*?)\\n?```', 'i')
    const langMatch = response.match(langRegex)
    if (langMatch) return langMatch[1].trim()
  }

  // Try generic fence
  const genericMatch = response.match(/```\s*\n([\s\S]*?)\n?```/)
  if (genericMatch) return genericMatch[1].trim()

  // Try any fence (with or without language tag)
  const anyMatch = response.match(/```(?:\w+)?\s*\n?([\s\S]*?)\n?```/)
  if (anyMatch) return anyMatch[1].trim()

  return null
}

export function extractJSON(response: string): Record<string, unknown> | null {
  // Try from ```json ``` fence first
  const fenced = extractCodeBlock(response, 'json')
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // fall through
    }
  }

  // Try to find first { and extract balanced JSON
  const start = response.indexOf('{')
  if (start !== -1) {
    let depth = 0
    for (let i = start; i < response.length; i++) {
      const ch = response[i]
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          const candidate = response.slice(start, i + 1)
          try {
            const parsed = JSON.parse(candidate)
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
              return parsed as Record<string, unknown>
            }
          } catch {
            // fall through
          }
          break
        }
      }
    }
  }

  return null
}
