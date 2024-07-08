namespace Breeze.Api.Expenses.RequestResponseObjects
{
    public class ExpenseRequest
    {
        public int? Id { get; set; }
        public string Name { get; set; }
        public int CategoryId { get; set; }
        public decimal Amount { get; set; }
        public DateOnly Date { get; set; }
    }
}