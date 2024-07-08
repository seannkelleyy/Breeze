namespace Breeze.Api.Incomes.RequestResponseObjects
{
    public class IncomeRequest
    {
        public int? Id { get; set; }
        public string Name { get; set; }
        public int BudgetId { get; set; }
        public decimal Amount { get; set; }
        public DateOnly Date { get; set; }
    }
}
