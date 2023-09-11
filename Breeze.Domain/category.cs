namespace Breeze.Domain
{
    public class Category
    {
        public int Id { get; set; }
        public string userId { get; set; }
        public string name { get; set; }
        public DateTime date { get; set; }
        public decimal budget { get; set; }
        public decimal currentSpend { get; set; }
    }
}
