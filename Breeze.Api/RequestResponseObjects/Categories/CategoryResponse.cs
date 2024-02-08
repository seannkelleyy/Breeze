using Breeze.Domain;

namespace Breeze.Api.RequestResponseObjects.Categories
{
    public class CategoryResponse
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public decimal Allocation { get; set; }
        public decimal Spent { get; set; }
        public int BudgetId { get; set; }
        public List<Expense> Expenses { get; set; }

    }
}
