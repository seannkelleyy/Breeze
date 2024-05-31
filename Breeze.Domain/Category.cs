namespace Breeze.Domain
{
    public class Category
    {
        public int Id { get; set; }
        public string UserEmail { get; set; }
        public string Name { get; set; }
        public Budget Budget { get; set; }
        public decimal Allocation { get; set; }
        public decimal CurrentSpend { get; set; }
        public List<Expense> Expenses { get; set; }
    }
}
