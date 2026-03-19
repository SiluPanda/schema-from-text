# schema-from-text — Task Breakdown

## Phase 1: Project Setup and Scaffolding

- [ ] **Install development dependencies** — Add `typescript`, `vitest`, `eslint`, and related config to `devDependencies` in `package.json`. Ensure `tsconfig.json` compiles correctly with `npm run build`. | Status: not_done
- [ ] **Add peer dependency for Zod** — Add `zod ^3.22.0` as an optional peer dependency in `package.json` under `peerDependencies` and `peerDependenciesMeta` with `"optional": true`. | Status: not_done
- [ ] **Create directory structure** — Create the following directories under `src/`: `pipeline/`, `validate/`, `prompts/`. Create the `__tests__/` directory at the project root. Matches the file structure specified in SPEC Section 19. | Status: not_done
- [ ] **Define type definitions in `src/types.ts`** — Implement all TypeScript types and interfaces specified in SPEC Section 11: `LLMFunction`, `OutputFormat`, `GenerateOptions`, `RefineOptions`, `GeneratorConfig`, `ValidationResult`, `AttemptRecord`, `SchemaResultBase`, `ZodResult`, `JSONSchemaResult`, `TypeScriptResult`, `AllFormatsResult`, `SchemaResult`. | Status: not_done
- [ ] **Set up `src/index.ts` with public API exports** — Export `generateSchema`, `generateZod`, `generateJSONSchema`, `generateTypeScript`, `refine`, `createGenerator`, and all public types from `src/index.ts`. Initially these can be stubs that throw "not implemented" errors. | Status: not_done
- [ ] **Add CLI binary entry point to `package.json`** — Add `"bin": { "schema-from-text": "./dist/cli.js" }` to `package.json`. Ensure the CLI file will have a `#!/usr/bin/env node` shebang. | Status: not_done
- [ ] **Configure vitest** — Add a `vitest.config.ts` (or inline vitest config in `package.json`) so that `npm run test` runs tests from `__tests__/`. | Status: not_done
- [ ] **Configure ESLint** — Add an ESLint config (e.g., `.eslintrc.json` or `eslint.config.js`) appropriate for TypeScript. Ensure `npm run lint` works. | Status: not_done

## Phase 2: Pipeline Infrastructure

### Step 1 — Description Parsing (`src/pipeline/parse-description.ts`)

- [ ] **Implement description normalization** — Normalize whitespace (collapse multiple spaces, trim leading/trailing whitespace) from the input description string. | Status: not_done
- [ ] **Implement structural hint detection** — Detect keywords in the description that indicate structural patterns: "array of", "list of", "nested", "optional", "required", "enum", "one of", "either...or". Return a metadata object with detected patterns (e.g., `{ hasArray: boolean, hasNesting: boolean, hasEnum: boolean, hasOptional: boolean }`). | Status: not_done
- [ ] **Implement type annotation detection** — Detect explicit type keywords in the description: "string", "number", "boolean", "date", "integer", "UUID", "email", "URL". These inform few-shot example selection. | Status: not_done
- [ ] **Write unit tests for description parsing** — Test normalization (multi-space collapse, trimming), structural hint detection for each keyword pattern, and type annotation detection. Cover edge cases: empty string, description with no hints, description with multiple hints. File: `__tests__/parse-description.test.ts`. | Status: not_done

### Step 4 — Output Extraction (`src/pipeline/extract.ts`)

- [ ] **Implement markdown fence stripping** — Detect and strip markdown code fences (`` ```typescript ``, `` ```json ``, `` ```ts ``, bare `` ``` ``). Extract the content inside the fences. Handle multiple fences (take the first/most relevant). | Status: not_done
- [ ] **Implement JSON extraction** — For JSON Schema output, extract a JSON object from surrounding prose using bracket matching (find the first `{`, match to its closing `}`). Handle nested braces correctly. | Status: not_done
- [ ] **Implement prose removal for code output** — For Zod and TypeScript output, identify the code portion by looking for lines starting with `z.`, `import`, `interface`, `type`, or `export`. Strip leading prose like "Here is the schema:". | Status: not_done
- [ ] **Implement trailing content removal** — Remove any text after the schema (explanations, notes, usage examples) by detecting the end of the schema code/JSON. | Status: not_done
- [ ] **Write unit tests for output extraction** — Test each extraction case: fenced code, JSON embedded in prose, Zod code with leading prose, TypeScript with trailing explanation, clean output with no extraction needed. File: `__tests__/extract.test.ts`. | Status: not_done

### Steps 6-7 — Error Formatting and Retry (`src/pipeline/retry.ts`)

- [ ] **Implement error feedback message construction** — Given a list of validation errors, the invalid output string, the original description, and the output format, construct a retry prompt following the template in SPEC Section 5 Step 7. Include: numbered error list, the invalid output, correction request, original description, output-only instruction. | Status: not_done
- [ ] **Implement retry loop logic** — Execute the LLM call, validate, and retry cycle. Track each attempt in an `AttemptRecord`. Respect `maxRetries` (default 3). Return the final `SchemaResult` with all attempt records. | Status: not_done
- [ ] **Implement AbortSignal support in retry loop** — Check `signal.aborted` before each LLM call. If aborted, return a failure result indicating cancellation. | Status: not_done
- [ ] **Write unit tests for retry logic** — Test: error feedback message format contains errors and output; retry loop stops on success; retry loop exhausts max retries; attempt records are correctly populated; AbortSignal cancellation. File: `__tests__/retry.test.ts`. | Status: not_done

## Phase 3: Prompts

### System Prompts

- [ ] **Implement Zod system prompt (`src/prompts/zod-system.ts`)** — Write the system prompt for Zod generation as specified in SPEC Section 7. Include: role description, full list of allowed Zod methods (`z.object`, `z.string`, `z.number`, `z.boolean`, `z.array`, `z.enum`, `z.literal`, `z.union`, `z.discriminatedUnion`, `z.tuple`, `z.record`, `z.any`, `z.unknown`, `z.null`, `z.undefined`, `z.void`, `z.date`, `z.bigint`) and chainable methods (`.optional()`, `.nullable()`, `.default()`, `.describe()`, `.min()`, `.max()`, `.length()`, `.email()`, `.url()`, `.uuid()`, `.regex()`, `.trim()`, `.int()`, `.positive()`, `.negative()`, `.nonnegative()`, `.nonpositive()`, `.finite()`, `.refine()`, `.transform()`), output rules (only `z.` expression, no variable assignment, no imports, no explanation, no markdown fences), type inference rules, ambiguity handling table. | Status: not_done
- [ ] **Implement JSON Schema system prompt (`src/prompts/json-schema-system.ts`)** — Write the system prompt for JSON Schema generation as specified in SPEC Section 7. Include: role description, draft version instruction (draft-07 or draft-2020-12 based on config), structural rules (root `type: "object"`, `properties` and `required` on objects, `items` on arrays, `format` for string formats, `enum` for enums), output rules (valid JSON only). | Status: not_done
- [ ] **Implement TypeScript system prompt (`src/prompts/typescript-system.ts`)** — Write the system prompt for TypeScript generation as specified in SPEC Section 7. Include: role description, style rules (`interface` for objects, `type` for unions/non-objects, extract nested objects as separate interfaces, `?` for optional, string literal unions for enums), output rules (declarations only, no runtime code). | Status: not_done
- [ ] **Implement refinement system prompt (`src/prompts/refine-system.ts`)** — Write the system prompt for schema refinement as specified in SPEC Section 9. Include: role as "schema modifier", instruction to apply modification to existing schema, return complete updated schema (not partial/diff), format-specific rules. | Status: not_done

### Few-Shot Examples

- [ ] **Implement few-shot examples (`src/prompts/examples.ts`)** — Create the three example sets specified in SPEC Section 7 (simple flat object, object with optional fields and enums, nested objects and arrays) for each output format (Zod, JSON Schema, TypeScript). Implement logic to select 2-3 examples based on structural hints from description parsing (e.g., if description has nesting, include nested example). | Status: not_done

### Prompt Construction

- [ ] **Implement prompt builder (`src/pipeline/build-prompt.ts`)** — Assemble the final prompt from four components: (1) format-specific system instruction, (2) selected few-shot examples based on structural hints, (3) user description, (4) output constraint ("Output ONLY the [format]. Start your response directly with [z. / { / interface or type]."). Return a single string. Support an optional `name` parameter for naming the type/interface. | Status: not_done
- [ ] **Write unit tests for prompt construction** — Verify prompt contains system instruction, few-shot examples, user description, and output constraint. Test format-specific prompt differences. Test that structural hints influence example selection. Test name parameter inclusion. File: `__tests__/prompts.test.ts`. | Status: not_done

## Phase 4: Validators

### Zod Code Validator (`src/validate/zod-validator.ts`)

- [ ] **Implement balanced delimiter checking** — Verify every `(` has a matching `)`, every `{` has a `}`, every `[` has a `]`. Return position-specific error messages for unmatched delimiters. | Status: not_done
- [ ] **Implement valid Zod method chain checking** — Verify that method calls after `z.` use known Zod method names. Flag unknown methods like `z.text()`, `z.integer()`. Check chainable methods are valid. | Status: not_done
- [ ] **Implement argument type checking** — Verify string arguments to `z.enum()` and `z.literal()` are valid string literals. Verify numeric arguments to `.min()` and `.max()` are valid numbers. | Status: not_done
- [ ] **Implement stray token detection** — Verify the expression ends cleanly after the final closing delimiter. Detect trailing prose, semicolons, or additional statements. | Status: not_done
- [ ] **Implement eval-based validation mode** — When `validate: 'eval'` is set, evaluate the code string using `new Function()` in a sandboxed scope where only `z` (the Zod library) is available. Catch runtime errors (`.email()` on number, empty enum array, etc.). Throw a clear error at configuration time if `zod` is not installed. Restrict scope: no `process`, `require`, `import`, `globalThis`, `fetch`. | Status: not_done
- [ ] **Write unit tests for Zod validator** — Test valid Zod expressions pass. Test unmatched parens fail with position. Test unknown methods fail. Test invalid arguments fail. Test stray tokens fail. Test eval mode catches runtime errors. Test eval mode error when zod not installed. File: `__tests__/validate-zod.test.ts`. | Status: not_done

### JSON Schema Validator (`src/validate/json-schema-validator.ts`)

- [ ] **Implement JSON parse validation** — Attempt `JSON.parse` on the output. Return clear error on malformed JSON (trailing commas, unquoted keys, single quotes). | Status: not_done
- [ ] **Implement root type validation** — Check the root schema has a `type` property with a valid JSON Schema type value (`"object"`, `"array"`, `"string"`, `"number"`, `"integer"`, `"boolean"`, `"null"`) or a composition keyword (`anyOf`, `oneOf`, `allOf`). | Status: not_done
- [ ] **Implement object schema structure validation** — If `type` is `"object"`, check `properties` is an object (if present), `required` is an array of strings (if present), and every string in `required` exists as a key in `properties`. | Status: not_done
- [ ] **Implement array schema structure validation** — If `type` is `"array"`, check `items` is present and is a valid schema. | Status: not_done
- [ ] **Implement enum validation** — If `enum` is present, check it is a non-empty array. | Status: not_done
- [ ] **Implement recursive nested schema validation** — Recursively validate every schema in `properties`, `items`, `anyOf`, `oneOf`, `allOf`, `$defs`, and `definitions`. | Status: not_done
- [ ] **Implement `$ref` resolution validation** — If `$ref` is present, check it points to a path that exists in `$defs` or `definitions`. | Status: not_done
- [ ] **Write unit tests for JSON Schema validator** — Test valid schemas pass. Test malformed JSON fails. Test invalid root type fails. Test `required` referencing non-existent property fails. Test array without `items` fails. Test empty enum fails. Test invalid nested schemas fail. Test broken `$ref` fails. File: `__tests__/validate-json-schema.test.ts`. | Status: not_done

### TypeScript Type Validator (`src/validate/typescript-validator.ts`)

- [ ] **Implement declaration keyword check** — Verify the output starts with `interface`, `type`, or `export` (followed by `interface` or `type`). | Status: not_done
- [ ] **Implement balanced braces check** — Verify every `{` has a matching `}`, `[` has `]`, `<` has `>`. | Status: not_done
- [ ] **Implement property syntax check** — Inside an interface body, verify each line matches `name: Type;` or `name?: Type;` with allowances for multiline types, generics, and inline object types. | Status: not_done
- [ ] **Implement type expression validation** — Verify type expressions use valid TypeScript types: primitives, array types (`T[]`, `Array<T>`), union types (`A | B`), intersection types (`A & B`), literal types, tuple types, object types. | Status: not_done
- [ ] **Implement multiple declaration support** — Handle output containing multiple `interface`/`type` declarations; validate each individually. | Status: not_done
- [ ] **Write unit tests for TypeScript validator** — Test valid interfaces pass. Test valid type aliases pass. Test missing declaration keyword fails. Test unbalanced braces fail. Test invalid property syntax fails. Test multiple declarations pass individually. File: `__tests__/validate-typescript.test.ts`. | Status: not_done

## Phase 5: Core Generation Functions

- [ ] **Implement `generateZod` (`src/generate.ts`)** — Implement the full pipeline for Zod generation: parse description, build Zod-specific prompt, call LLM, extract output, validate with Zod validator (syntax or eval mode per config), retry on failure with error feedback, return `ZodResult`. Default format is Zod. | Status: not_done
- [ ] **Implement `generateJSONSchema` (`src/generate.ts`)** — Implement the full pipeline for JSON Schema generation: parse description, build JSON Schema-specific prompt (with draft version config), call LLM, extract output (JSON extraction), validate with JSON Schema validator, retry, return `JSONSchemaResult`. | Status: not_done
- [ ] **Implement `generateTypeScript` (`src/generate.ts`)** — Implement the full pipeline for TypeScript generation: parse description, build TypeScript-specific prompt, call LLM, extract output, validate with TypeScript validator, retry, return `TypeScriptResult`. | Status: not_done
- [ ] **Implement `generateSchema` (`src/generate.ts`)** — Implement the unified entry point that delegates to `generateZod`, `generateJSONSchema`, or `generateTypeScript` based on the `format` option. Default format is `"zod"`. | Status: not_done
- [ ] **Implement `format: 'all'` support in `generateSchema`** — When `format: 'all'` is specified, make three sequential LLM calls (one per format), and return an `AllFormatsResult` with `zod`, `jsonSchema`, and `typescript` fields. Mark overall `success` based on individual results. | Status: not_done
- [ ] **Implement custom validator support** — After built-in validation passes, run the caller-provided `validator` function (if provided) on the extracted output. If it returns `{ valid: false, errors: [...] }`, treat as validation failure and trigger retry. | Status: not_done
- [ ] **Write unit tests for generation functions** — Test with mock LLM: successful generation for each format, correct prompt construction, correct result structure, custom validator integration, `format: 'all'` behavior. File: `__tests__/generate.test.ts`. | Status: not_done

## Phase 6: Refinement

- [ ] **Implement `refine` function (`src/refine.ts`)** — Construct a refinement prompt containing the existing schema and modification instruction (per SPEC Section 9). Call LLM, extract, validate through the same pipeline. Return updated `SchemaResult`. | Status: not_done
- [ ] **Implement `checkModified` validation** — When `checkModified` is `true` (default), compare the refined output to the input schema. If identical, mark result as failed with an error message indicating the modification was not applied. Allow disabling with `checkModified: false`. | Status: not_done
- [ ] **Write unit tests for refinement** — Test refinement produces modified output. Test `checkModified` detects unchanged output. Test `checkModified: false` allows unchanged output. Test refinement with retry on validation failure. Test all three output formats. File: `__tests__/refine.test.ts`. | Status: not_done

## Phase 7: Factory

- [ ] **Implement `createGenerator` factory (`src/factory.ts`)** — Return a `SchemaGenerator` object with `generate()` and `refine()` methods. Store default config (`llm`, `format`, `maxRetries`, `validate`, `jsonSchemaDraft`). Merge per-call options with stored config using the precedence: built-in defaults < factory config < per-call options. | Status: not_done
- [ ] **Write unit tests for factory** — Test config precedence (factory defaults overridden by per-call options). Test `generate()` delegates to `generateSchema`. Test `refine()` delegates to `refine`. Test multiple calls with different options. File: `__tests__/factory.test.ts`. | Status: not_done

## Phase 8: Integration Tests

- [ ] **Write integration tests for successful first-attempt generation** — Mock LLM returns valid Zod code. Verify `success: true`, `attempts: 1`, `code` field populated. | Status: not_done
- [ ] **Write integration tests for success on retry** — Mock LLM returns invalid code first, then valid code. Verify `success: true`, `attempts: 2`, `attemptRecords` has both attempts. | Status: not_done
- [ ] **Write integration tests for failure after max retries** — Mock LLM returns invalid code on every attempt. Verify `success: false`, `attempts: 4` (1 + 3 retries), `errors` populated. | Status: not_done
- [ ] **Write integration tests for JSON Schema generation** — Mock LLM returns valid JSON Schema. Verify `success: true`, `schema` is a valid parsed object. | Status: not_done
- [ ] **Write integration tests for TypeScript generation** — Mock LLM returns valid TypeScript. Verify `success: true`, `code` contains `interface`. | Status: not_done
- [ ] **Write integration tests for `format: 'all'`** — Mock LLM returns valid output for each format. Verify `zod`, `jsonSchema`, and `typescript` fields all populated. | Status: not_done
- [ ] **Write integration tests for refinement** — Mock LLM returns modified schema. Verify `success: true`, output differs from input. | Status: not_done
- [ ] **Write integration tests for markdown fence extraction** — Mock LLM returns valid code wrapped in code fences. Verify extraction strips fences, validation passes. | Status: not_done
- [ ] **Write integration tests for prose extraction** — Mock LLM returns "Here is the schema:" followed by valid code. Verify extraction strips prose, validation passes. | Status: not_done
- [ ] **Write integration tests for custom validator rejection** — Mock LLM returns valid code containing `.transform()`. Custom validator rejects it. Verify `success: false` with custom validator error. | Status: not_done
- [ ] **Write integration tests for AbortSignal cancellation** — Provide an aborted signal. Verify `success: false`, result indicates cancellation. | Status: not_done
- [ ] **Consolidate integration tests in `__tests__/integration.test.ts`** — Ensure all above integration test scenarios are organized in a single test file with descriptive test names. | Status: not_done

## Phase 9: CLI

- [ ] **Implement CLI argument parsing (`src/cli.ts`)** — Parse positional argument (description string) and all flags specified in SPEC Section 14: `-f/--format`, `-o/--output`, `-n/--name`, `-r/--retries`, `--provider`, `--model`, `--api-key`, `--validate`, `--json-schema-draft`, `--refine`, `--modification`, `-q/--quiet`, `-v/--version`, `-h/--help`. Use a lightweight argument parser (or manual parsing) to keep dependencies minimal. | Status: not_done
- [ ] **Implement stdin support for CLI** — When no positional description argument is provided, read the description from stdin. Support piped input (e.g., `echo "a user" | schema-from-text`). | Status: not_done
- [ ] **Implement built-in OpenAI adapter for CLI** — Dynamically import `openai` SDK. Read API key from `OPENAI_API_KEY` env var or `--api-key` flag. Create the LLM function wrapper. Handle missing SDK with a clear error message ("Please install the 'openai' package"). | Status: not_done
- [ ] **Implement built-in Anthropic adapter for CLI** — Dynamically import `@anthropic-ai/sdk`. Read API key from `ANTHROPIC_API_KEY` env var or `--api-key` flag. Create the LLM function wrapper. Handle missing SDK with clear error message. | Status: not_done
- [ ] **Implement CLI output formatting** — Write generated schema to stdout by default. Write progress/stats to stderr. Support `--output` flag to write to a file. Support `--quiet` to suppress non-schema output. | Status: not_done
- [ ] **Implement CLI refinement mode** — When `--refine <schema-file>` and `--modification <instruction>` are provided, read the existing schema from the file, call `refine()`, and output the result. Validate that both flags are provided together. | Status: not_done
- [ ] **Implement CLI exit codes** — Exit 0 on success, 1 on generation failure (after retries), 2 on configuration/usage errors (invalid flags, missing API key, missing description). | Status: not_done
- [ ] **Implement CLI `--version` flag** — Read version from `package.json` and print to stdout. | Status: not_done
- [ ] **Implement CLI `--help` flag** — Print usage information matching the help text in SPEC Section 14. | Status: not_done
- [ ] **Write CLI tests** — Test argument parsing for all flags. Test stdin input. Test output to file. Test exit codes. Test `--help` and `--version`. Test error on missing description. Test error on missing API key. Test `--refine` without `--modification` error. File: `__tests__/cli.test.ts`. | Status: not_done

## Phase 10: Advanced Validation

- [ ] **Implement strict JSON Schema validation with optional `ajv`** — When `validate: 'strict'` is set (for JSON Schema output), dynamically import `ajv` and use it for full meta-schema validation. If `ajv` is not installed, throw a clear error. | Status: not_done
- [ ] **Write tests for strict JSON Schema validation** — Test schemas that pass lightweight validation but fail strict `ajv` validation. Test error when `ajv` is not installed. | Status: not_done

## Phase 11: End-to-End Tests

- [ ] **Write E2E test for simple Zod generation** — Real LLM call with "a user with name and email". Verify generated code parses as valid Zod. Eval the schema and validate sample data. Gated behind `RUN_E2E_TESTS=true`. | Status: not_done
- [ ] **Write E2E test for complex nested Zod generation** — Real LLM call with "an order with items array, shipping address, billing address". Verify multi-level nested schema. Eval and validate sample order object. | Status: not_done
- [ ] **Write E2E test for JSON Schema generation** — Real LLM call with "a product with name, price, category". Verify JSON validates against meta-schema. Optionally compile with `ajv`. | Status: not_done
- [ ] **Write E2E test for TypeScript generation** — Real LLM call with "a config with host, port, debug". Verify output contains valid `interface` declaration. | Status: not_done
- [ ] **Write E2E test for refinement round-trip** — Generate base schema, then refine with "add email validation". Verify refined schema includes `.email()` or `"format": "email"`. | Status: not_done
- [ ] **Write E2E test for CLI smoke test** — Run CLI binary with a description. Verify exit code 0 and stdout contains valid schema. | Status: not_done
- [ ] **Consolidate E2E tests in `__tests__/e2e.test.ts`** — All E2E tests gated behind `RUN_E2E_TESTS=true` env var. Add `openai` and `@anthropic-ai/sdk` as dev dependencies for E2E tests. | Status: not_done

## Phase 12: Documentation

- [ ] **Write README.md** — Include: package description, installation instructions, quick start example, API reference for all public functions (`generateSchema`, `generateZod`, `generateJSONSchema`, `generateTypeScript`, `refine`, `createGenerator`), CLI usage, all configuration options with defaults, LLM adapter examples (OpenAI, Anthropic, Ollama), peer dependency notes, integration examples with monorepo packages (`schema-bridge`, `llm-retry`, `tool-output-guard`). | Status: not_done
- [ ] **Add JSDoc comments to all public exports** — Add comprehensive JSDoc to every public function, type, and interface in `src/types.ts`, `src/generate.ts`, `src/refine.ts`, `src/factory.ts`, and `src/index.ts`. Include parameter descriptions, return type descriptions, and usage examples. | Status: not_done

## Phase 13: Build and Publish Preparation

- [ ] **Verify `npm run build` succeeds** — Run `tsc` and confirm all source files compile to `dist/` with declarations and source maps. Fix any type errors. | Status: not_done
- [ ] **Verify `npm run lint` passes** — Run ESLint on all source files. Fix any lint errors. | Status: not_done
- [ ] **Verify `npm run test` passes** — Run the full vitest suite. All unit and integration tests must pass. | Status: not_done
- [ ] **Verify package.json metadata** — Confirm `name`, `version`, `description`, `main`, `types`, `files`, `bin`, `keywords`, `license`, `engines`, and `publishConfig` are correctly set. Add relevant keywords (e.g., `schema`, `zod`, `json-schema`, `typescript`, `llm`, `ai`, `code-generation`). | Status: not_done
- [ ] **Bump version to 1.0.0** — Update `version` in `package.json` from `0.1.0` to `1.0.0` for initial release. | Status: not_done
- [ ] **Test `npm pack` output** — Run `npm pack` and inspect the tarball to verify only `dist/` files are included (per `"files": ["dist"]`). Confirm no source files, test files, or config files leak into the package. | Status: not_done
