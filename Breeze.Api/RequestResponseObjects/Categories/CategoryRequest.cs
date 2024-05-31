namespace Breeze.Api.RequestResponseObjects.Categories
{
    public class CategoryRequest
    {
        public int? Id { get; set; }
        public string Name { get; set; }
        public decimal Allcoation { get; set; }
        public decimal CurrentSpend { get; set; }
        public int BudgetId { get; set; }
    }
}
