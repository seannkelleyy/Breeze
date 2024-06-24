namespace Breeze.Domain
{
    public class Category
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
        public int BudgetId { get; set; }
        public decimal Allocation { get; set; }
        public decimal CurrentSpend { get; set; }
    }
}
