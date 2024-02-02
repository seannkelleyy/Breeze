namespace Breeze.Api.RequestResponseObjects.Expenses
{
    public class ExpenseResponse
    {
        public int Id { get; set; }
        public string UserEmail { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public int CategoryId { get; set; }
        public decimal Amount { get; set; }
    }
}
