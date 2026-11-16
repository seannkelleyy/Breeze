import { graphql } from '@/lib/gql';

export const GET_TAX_YEAR_DATA = graphql(`
  query GetTaxYearData($filingStatus: FilingStatus!) {
    taxYearData(filingStatus: $filingStatus) {
      year
      brackets {
        minimumAmount
        maximumAmount
        rate
      }
      standardDeduction
      ssWageBase
    }
  }
`);
