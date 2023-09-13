namespace Breeze.Api.RequestResponseObjects.Categories
{
    public class CategoryResponse
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public decimal Budget { get; set; }
        public decimal CurrentSpend { get; set; }
        public int BudgetId { get; set; }
    }
}
