using Breeze.Api.Goals.RequestResponseObjects;
using Breeze.Data;
using Breeze.Domain;

namespace Breeze.Api.Goals
{
    /// <summary>
    /// Service for managing goals.
    /// </summary>
    public class GoalService
    {
        private IConfiguration _config;
        private readonly ILogger _logger;
        private readonly BreezeContext db;

        /// <summary>
        /// Initializes a new instance of the <see cref="GoalService"/> class.
        /// </summary>
        /// <param name="config">Configuration interface.</param>
        /// <param name="dbContext">Database context for Breeze.</param>
        /// <param name="logger">Logger for logging errors and information.</param>
        public GoalService(IConfiguration config, BreezeContext dbContext, ILogger logger)
        {
            _config = config;
            _logger = logger;
            db = dbContext;
        }

        /// <summary>
        /// Retrieves an goal by its ID.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="goalId">The goal's identifier.</param>
        /// <returns>An goal response object or null if not found.</returns>
        public GoalResponse? GetGoalById(string userId, int goalId)
        {
            try
            {
                return db.Goals
                    .Where(goal => goal.Id.Equals(goalId) && goal.UserId.Equals(userId))
                    .Select(goal => new GoalResponse
                    {
                        Id = goal.Id,
                        UserId = goal.UserId,
                        Description = goal.Description,
                        IsCompleted = goal.IsCompleted,
                    }).First();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        /// <summary>
        /// Retrieves goals by user ID.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <returns>A list of goal response objects or null if an error occurs.</returns>
        public List<GoalResponse>? GetGoalsByUserId(string userId)
        {
            try
            {
                return db.Goals
                    .Where(goal => goal.UserId.Equals(userId))
                    .Select(goal => new GoalResponse
                    {
                        Id = goal.Id,
                        UserId = goal.UserId,
                        Description = goal.Description,
                        IsCompleted = goal.IsCompleted,
                    })
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        /// <summary>
        /// Creates a new goal.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="newGoal">The new goal to create.</param>
        /// <returns>
        /// The ID of the created goal, or one of the following error codes:
        /// -1: Cannot find foreign key dependency item.
        /// -5: Unknown error.
        /// </returns>
        public int CreateGoal(string userId, GoalRequest newGoal)
        {
            try
            {

                Goal goal = new Goal
                {
                    UserId = userId,
                    Description = newGoal.Description,
                    IsCompleted = false,
                };
                db.Goals.Add(goal);
                db.SaveChanges();
                return goal.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Updates an existing goal.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="updatedGoal">The updated goal information.</param>
        /// <returns>
        /// The ID of the updated goal, or one of the following error codes:
        /// -1: Cannot find foreign key dependency item.
        /// -4: Unauthorized access.
        /// -5: Unknown error.
        /// </returns>
        public int UpdateGoal(string userId, GoalRequest updatedGoal)
        {
            try
            {
                var goal = db.Goals.Find(updatedGoal.Id);
                if (goal is null)
                {
                    return -2;
                }
                if (!goal.UserId.Equals(userId))
                {
                    return -4;
                }
                goal.Description = updatedGoal.Description;
                goal.IsCompleted = (bool)updatedGoal.IsCompleted!;

                db.Goals.Update(goal);
                db.SaveChanges();
                return goal.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Deletes an goal by its ID.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="goalId">The goal's identifier.</param>
        /// <returns>
        /// The ID of the deleted goal, or one of the following error codes:
        /// -2: Cannot find item.
        /// -4: Unauthorized access.
        /// -5: Unknown error.
        /// </returns>
        public int DeleteGoalById(string userId, int goalId)
        {
            try
            {
                var goal = db.Goals.Find(goalId);
                if (goal is null)
                {
                    return -2;
                }
                if (!goal.UserId.Equals(userId))
                {
                    return -4;
                }
                db.Goals.Remove(goal);
                db.SaveChanges();
                return goalId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }

        }

        /// <summary>
        /// Deletes all goals for a given user.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <returns>
        /// 1 if the goals were deleted, or one of the following error codes:
        /// -2: Cannot find item.
        /// -5: Unknown error.
        /// </returns>
        public int DeleteGoalForUser(string userId)
        {
            try
            {
                List<Goal> goals = (List<Goal>)db.Goals
                    .Where(goal => goal.UserId.Equals(userId));
                if (goals is null || goals.Count().Equals(0))
                {
                    return -2;
                }
                db.Goals.RemoveRange(goals);
                db.SaveChanges();
                return 1;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }
    }
}
