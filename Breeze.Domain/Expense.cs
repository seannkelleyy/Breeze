namespace Breeze.Domain
{
    public class Expense
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public decimal Amount { get; set; }
        public DateOnly Date { get; set; }
    }
}
