namespace Breeze.Api.Goals.RequestResponseObjects
{
    public class GoalResponse
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Description { get; set; }
        public bool IsCompleted { get; set; }
    }
}
