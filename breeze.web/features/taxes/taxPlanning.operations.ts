import { graphql } from '@/lib/gql';

export const ESTIMATE_TAXES_FOR_YEAR = graphql(`
  query EstimateTaxesForYear(
    $year: Int!
    $filingStatus: FilingStatus!
    $income: String!
    $deduction: String
  ) {
    estimateTaxesForYear(
      year: $year
      filingStatus: $filingStatus
      income: $income
      deduction: $deduction
    ) {
      taxOwed
      taxableIncome
      effectiveRate
      marginalRate
    }
  }
`);
