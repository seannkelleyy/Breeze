namespace Breeze.Api.Goals.RequestResponseObjects
{
    public class GoalRequest
    {
        public int? Id { get; set; }
        public string Description { get; set; }
        public bool? IsCompleted { get; set; }
    }
}
