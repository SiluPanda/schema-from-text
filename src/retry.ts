import { AttemptRecord } from './types'

export interface RetryAttemptResult<T> {
  result: T
  rawOutput: string
  errors: string[]
}

export async function withRetry<T>(
  fn: (attempt: number, lastErrors?: string[]) => Promise<RetryAttemptResult<T>>,
  options: { maxRetries: number; signal?: AbortSignal }
): Promise<{ result: T; valid: boolean; attempts: number; attemptRecords: AttemptRecord[] }> {
  const { maxRetries, signal } = options
  const attemptRecords: AttemptRecord[] = []
  let lastErrors: string[] | undefined
  let finalResult!: T
  let finalValid = false

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) {
      throw new Error('Operation aborted')
    }

    const { result, rawOutput, errors } = await fn(attempt, lastErrors)
    const validated = errors.length === 0

    attemptRecords.push({
      attempt,
      rawOutput,
      validated,
      errors: errors.length > 0 ? errors : undefined,
    })

    finalResult = result
    finalValid = validated

    if (validated) break
    lastErrors = errors
  }

  return { result: finalResult, valid: finalValid, attempts: attemptRecords.length, attemptRecords }
}
