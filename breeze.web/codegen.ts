import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * graphql-codegen configuration.
 *
 * Reads the canonical GraphQL schema from the Go API and generates
 * TypeScript types into lib/gql/.
 *
 * The generated types serve as a reference contract between API and UI.
 * When the API schema changes, re-run `npm run gen` to update them.
 * Cross-reference the generated types when using API response data.
 */
const config: CodegenConfig = {
  schema: '../breeze.api/graph/schema.graphqls',
  generates: {
    './lib/gql/': {
      preset: 'client',
      config: {
        enumsAsTypes: true,
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
