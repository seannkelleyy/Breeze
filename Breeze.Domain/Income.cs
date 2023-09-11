namespace Breeze.Domain
{
    public class Income
    {
        public int Id { get; set; }
        public string userId { get; set; }
        public string name { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public Budget Budget { get; set; }
    }
}
