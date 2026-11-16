import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Generates typed GraphQL documents (TypedDocumentNode) from the API's
 * gqlgen schema. Output lives in lib/gql/ — never edit those files by hand.
 *
 * Run: npm run codegen
 */
const config: CodegenConfig = {
  schema: '../breeze.api/graph/schema.graphqls',
  documents: ['**/*.{ts,tsx}', '!lib/gql/**', '!node_modules/**', '!.next/**'],
  generates: {
    'lib/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
    },
  },
};

export default config;
