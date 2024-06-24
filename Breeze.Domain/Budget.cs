namespace Breeze.Domain
{
    public class Budget
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public decimal? MonthlyIncome { get; set; }
        public decimal? MonthlyExpenses { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
    }
}
