namespace Breeze.Api.RequestResponseObjects.Budgets
{
    public class BudgetRequest
    {
        public int? Id { get; set; }
        public string UserId { get; set; }
        public DateTime Date { get; set; }
        public decimal MonthlyIncome { get; set; }
        public decimal MonthlySaving { get; set; }
    }
}
