import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../breeze.api/graph/schema.graphqls',
  generates: {
    './lib/__generated__/gql.ts': {
      plugins: ['typescript'],
      config: {
        // Enums as types avoids TS errors for numeric-starting values (_401K, _403B)
        enumsAsTypes: true,
        maybeValue: 'T | null | undefined',
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
