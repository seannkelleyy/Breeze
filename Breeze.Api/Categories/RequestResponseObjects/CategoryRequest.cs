namespace Breeze.Api.Categories.RequestResponseObjects
{
    public class CategoryRequest
    {
        public int? Id { get; set; }
        public string Name { get; set; }
        public decimal Allocation { get; set; }
        public decimal CurrentSpend { get; set; }
        public int BudgetId { get; set; }
    }
}
