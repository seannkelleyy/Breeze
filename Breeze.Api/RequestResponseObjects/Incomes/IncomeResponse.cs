namespace Breeze.Api.RequestResponseObjects.Incomes
{
    public class IncomeResponse
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public int BudgetId { get; set; }
        public string Name { get; set; }
        public decimal Amount { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }
    }
}
