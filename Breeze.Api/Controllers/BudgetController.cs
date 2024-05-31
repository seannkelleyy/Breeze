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
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userEmail == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(budgets.GetBudget(userEmail, year, month));
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
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userEmail == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(budgets.CreateBudget(userEmail, budgetRequest));
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
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userEmail == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(budgets.UpdateBudget(userEmail, budgetRequest));
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
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userEmail == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                incomes.DeleteIncomesForBudget(budgetId);
                categories.DeleteCategoriesForBudget(budgetId);
                return Ok(budgets.DeleteBudget(userEmail, budgetId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }
    }
}
