export const GET_TAX_YEAR_DATA = `query GetTaxYearData($filingStatus: FilingStatus!) {
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
}`;
