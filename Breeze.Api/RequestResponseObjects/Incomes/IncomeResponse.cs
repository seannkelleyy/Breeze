using Breeze.Domain;

namespace Breeze.Api.RequestResponseObjects.Incomes
{
    public class IncomeResponse
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public int BudgetId { get; set; }
    }
}
