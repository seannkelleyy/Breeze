namespace Breeze.Api.RequestResponseObjects.Expenses
{
    public class ExpenseRequest
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public int CategoryId { get; set; }
        public decimal Amount { get; set; }
    }
}
