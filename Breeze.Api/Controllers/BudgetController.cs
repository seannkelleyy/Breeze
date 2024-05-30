using Breeze.Api.RequestResponseObjects.Budgets;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("/budgets")]
    public class BudgetController : ControllerBase
    {
        private readonly BudgetService budgets;
        private readonly CategoryService categories;
        private readonly IncomeService incomes;
        private readonly ILogger<BudgetController> _logger;

        public BudgetController(IConfiguration config, ILogger<BudgetController> logger, BreezeContext breezeContext)
        {
            budgets = new BudgetService(config, breezeContext, logger);
            categories = new CategoryService(config, breezeContext, logger);
            incomes = new IncomeService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet("{year}/{month}")]
        public IActionResult GetBudget([FromRoute] int year, [FromRoute] int month)
        {

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(budgets.GetBudget(userId, year, month));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpPost]
        public IActionResult PostBudget(BudgetRequest budgetRequest)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(budgets.CreateBudget(userId, budgetRequest));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpPatch]
        public IActionResult PatchBudget(BudgetRequest budgetRequest)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                return Ok(budgets.UpdateBudget(userId, budgetRequest));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteBudget([FromRoute] int budgetId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                incomes.DeleteIncomesForBudget(budgetId);
                categories.DeleteCategoriesForBudget(budgetId);
                return Ok(budgets.DeleteBudget(userId, budgetId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }
    }
}
