using Breeze.Domain;

namespace Breeze.Api.RequestResponseObjects.Budgets
{
    public class BudgetResponse
    {
        public int Id { get; set; }
        public string UserEmail { get; set; }
        public decimal? MonthlyIncome { get; set; }
        public decimal? MonthlyExpenses { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
        public List<Category> Categories { get; set; }
        public List<Income> Income { get; set; }
    }
}
