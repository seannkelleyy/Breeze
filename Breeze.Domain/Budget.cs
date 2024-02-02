namespace Breeze.Domain
{
    public class Budget
    {
        public int Id { get; set; }
        public User User { get; set; }
        public DateTime Date { get; set; }
        public decimal MonthlyIncome { get; set; }
        public decimal MonthlyExpenses { get; set; }
        public List<Category> Categories { get; set; }
        public List<Income> Income { get; set; }
    }
}
