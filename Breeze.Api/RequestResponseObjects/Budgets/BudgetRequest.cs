namespace Breeze.Api.RequestResponseObjects.Budgets
{
    public class BudgetRequest
    {
        public int Id { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal? MonthlyIncome { get; set; }
        public decimal? MonthlyExpenses { get; set; }
    }
}