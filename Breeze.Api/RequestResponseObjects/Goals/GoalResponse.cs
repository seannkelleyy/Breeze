namespace Breeze.Api.RequestResponseObjects.Goals
{
    public class GoalResponse
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Description { get; set; }
        public int IsCompleted { get; set; }
    }
}
