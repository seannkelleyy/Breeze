import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * graphql-codegen configuration.
 *
 * Reads the canonical GraphQL schema from the Go API and generates
 * TypeScript types + typed documents for the frontend.
 *
 * Run: `npm run gen`   (or `graphql-codegen` directly)
 *
 * When the API schema changes, re-run this to keep frontend types in sync.
 *
 * If the frontend query strings drift from the schema, codegen will fail
 * at build time — preventing silent mismatches between API and UI.
 */
const config: CodegenConfig = {
  schema: '../breeze.api/graph/schema.graphqls',
  documents: ['lib/services/queries/*.ts', 'lib/services/hooks/*.ts'],
  generates: {
    './lib/__generated__/gql.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        // Monetary fields arrive as strings on the wire — keep them as
        // strings in generated types so callers parse deliberately.
        maybeValue: 'T | null | undefined',
        avoidOptionals: {
          field: true,
          inputValue: false,
        },
        // All IDs are strings (GraphQL ID! translates to string)
        scalars: {
          ID: 'string',
          UUID: 'string',
          DateTime: 'string',
          Upload: 'File',
        },
      },
    },
  },
};

export default config;
