/**
 * Tax year reference data as consumed by client-side tax math.
 * Populated from the API's taxYearData query (brackets, standard deduction,
 * and FICA parameters for one year, pre-filtered to the active filing status).
 */

export interface TaxBracketRow {
  minimum: number;
  maximum: number | null;
  rate: number;
}

export interface TaxYearTables {
  year: number;
  brackets: TaxBracketRow[];
  standardDeduction: number;
  ssWageBase: number;
}
