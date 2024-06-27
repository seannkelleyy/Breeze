namespace Breeze.Api.Incomes.RequestResponseObjects
{
    public class IncomeResponse
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public int BudgetId { get; set; }
        public string Name { get; set; }
        public decimal Amount { get; set; }
        public DateOnly Date { get; set; }
    }
}
