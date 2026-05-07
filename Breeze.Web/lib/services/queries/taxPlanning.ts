export const CALCULATE_TAX_ESTIMATE = `
  query CalculateTaxEstimate(
    $year: Int!
    $filingStatus: FilingStatus!
    $income: String!
    $deductionAmount: String
  ) {
    calculateTaxEstimate(
      year: $year
      filingStatus: $filingStatus
      income: $income
      deductionAmount: $deductionAmount
    ) {
      taxOwed
      taxableIncome
      effectiveRate
      marginalRate
    }
  }
`;
