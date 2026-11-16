import { graphql } from '@/lib/gql';

export const ME_QUERY = graphql(`
  query Me {
    me {
      id
      email
      identityProviderId
      inflationRate
      safeWithdrawalRate
      filingStatus
      returnType
      currencyType
      deductionType
      deductionAmount
      payoffStrategy
      maxTaxBracketId
      createdAt
      updatedAt
    }
  }
`);
