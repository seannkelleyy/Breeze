using Breeze.Api.Categories;
using Breeze.Api.Incomes;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;

namespace Breeze.Api.Budgets
{
    [ApiController]
    [Route("/budgets")]
    public class BudgetController : ControllerBase
    {
        private readonly BudgetService budgets;
        private readonly ILogger<BudgetController> _logger;

        public BudgetController(IConfiguration config, ILogger<BudgetController> logger, BreezeContext breezeContext)
        {
            budgets = new BudgetService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet("{year}-{month}")]
        public IActionResult GetBudget([FromRoute] int year, [FromRoute] int month)
        {

            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(budgets.GetBudgetByDate(userId, new DateOnly(year, month, 1)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }
    }
}
