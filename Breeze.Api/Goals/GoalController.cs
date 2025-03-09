using Breeze.Api.Expenses;
using Breeze.Api.Goals.RequestResponseObjects;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web;
using Microsoft.AspNetCore.Authorization;

namespace Breeze.Api.Goals
{
    [Authorize]
    [ApiController]
    [Route("/users/{userId}/goals")]
    public class GoalController : ControllerBase
    {
        private readonly GoalService goals;
        private readonly ILogger<ExpenseController> _logger;

        public GoalController(IConfiguration config, ILogger<ExpenseController> logger, BreezeContext breezeContext)
        {
            goals = new GoalService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet]
        public IActionResult GetGoalsForUser()
        {
            try
            {
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(goals.GetGoalsByUserId(userId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public IActionResult PostGoal(GoalRequest goalRequest)
        {
            try
            {
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = goals.CreateGoal(userId, goalRequest);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch]
        public IActionResult PatchGoal([FromBody] GoalRequest goalRequest)
        {
            try
            {
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = goals.UpdateGoal(userId, goalRequest);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteGoal([FromRoute] int id)
        {
            try
            {
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(goals.DeleteGoalById(userId, id));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
