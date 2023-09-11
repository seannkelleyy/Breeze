namespace Breeze.Domain
{
    public class Expense
    {
        public int Id { get; set; }
        public string userId { get; set; }
        public string? name { get; set; }
        public DateTime date { get; set; }
        public Category category { get; set; }
        public decimal cost { get; set; }
    }
}
