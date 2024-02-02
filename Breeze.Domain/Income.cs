namespace Breeze.Domain
{
    public class Income
    {
        public int Id { get; set; }
        public User User { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public Budget Budget { get; set; }
    }
}
