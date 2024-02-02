namespace Breeze.Domain
{
    public class Category
    {
        public int Id { get; set; }
        public User User { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public decimal Allocation { get; set; }
        public decimal Spent { get; set; }
        public Budget Budget { get; set; }
        public List<Expense> Expenses { get; set; }
    }
}
