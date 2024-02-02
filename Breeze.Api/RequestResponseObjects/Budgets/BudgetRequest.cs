using Breeze.Domain;

namespace Breeze.Api.RequestResponseObjects.Budgets
{
    public class BudgetRequest
    {
        public int? Id { get; set; }
        public DateTime Date { get; set; }
        public decimal MonthlyIncome { get; set; }
        public decimal MonthlyExpenses { get; set; }
    }
}
