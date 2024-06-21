namespace Breeze.Api.RequestResponseObjects.Goals
{
    public class GoalRequest
    {
        public int? Id { get; set; }
        public string Description { get; set; }
        public bool? IsCompleted { get; set; }
    }
}
