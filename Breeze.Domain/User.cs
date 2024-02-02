namespace Breeze.Domain
{
    public class User
    {
        public int Id { get; set; }
        public string UserEmail { get; set; }
        public int Role { get; set; }
        public List<Budget> Budgets { get; set; }
        public List<Expense> Expenses { get; set; }
        public List<Income> Incomes { get; set; }
        public List<Category> Categories { get; set; }
    }
}
