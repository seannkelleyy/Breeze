namespace Breeze.Domain
{
    public class Income
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public Budget Budget { get; set; }
    }
}
