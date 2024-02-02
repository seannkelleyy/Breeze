namespace Breeze.Api.RequestResponseObjects.Categories
{
    public class CategoryRequest
    {
        public int? Id { get; set; }
        public string UserEmail { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public decimal Allcoation { get; set; }
        public decimal Spent { get; set; }
        public int BudgetId { get; set; }
    }
}
