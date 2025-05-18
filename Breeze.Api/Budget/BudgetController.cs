using System.Diagnostics;
using Breeze.Api.Categories;
using Breeze.Api.Incomes;
using Breeze.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web;

namespace Breeze.Api.Budgets
{
    [Authorize]
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
        [Authorize]
        public IActionResult GetBudget([FromRoute] int year, [FromRoute] int month)
        {
            try
            {
                var userId = User.FindFirst("sub")?.Value;

                if (string.IsNullOrWhiteSpace(userId))
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }

                var budget = budgets.GetBudgetByDate(userId, new DateOnly(year, month, 1));
                return Ok(budget);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get budget");
                return BadRequest("Something went wrong.");
            }
        }

    }
}
