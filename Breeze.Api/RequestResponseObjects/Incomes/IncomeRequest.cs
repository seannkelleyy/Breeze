namespace Breeze.Api.RequestResponseObjects.Incomes
{
    public class IncomeRequest
    {
        public int? Id { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public int BudgetId { get; set; }
    }
}
