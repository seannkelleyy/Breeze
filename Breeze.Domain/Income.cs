namespace Breeze.Domain
{
    public class Income
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public Budget Budget { get; set; }
        public string Name { get; set; }
        public decimal Amount { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }
    }
}
