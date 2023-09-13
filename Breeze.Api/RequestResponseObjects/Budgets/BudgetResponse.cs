using Breeze.Domain;

namespace Breeze.Api.RequestResponseObjects.Budgets
{
    public class BudgetResponse
    {
        public int? Id { get; set; }
        public string UserId { get; set; }
        public DateTime Date { get; set; }
        public decimal MonthlyIncome { get; set; }
        public decimal MonthlySaving { get; set; }
        public List<Category> Categories { get; set; }
        public List<Income> Income { get; set; }
    }
}
