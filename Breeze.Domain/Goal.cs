namespace Breeze.Domain
{
    public class Goal
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Description { get; set; }
        public bool IsCompleted { get; set; }
    }
}
