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

        [HttpGet("{year}-{month}")]
        public IActionResult GetBudget([FromRoute] int year, [FromRoute] int month)
        {

            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(budgets.GetBudgetByDate(userId, year, month));
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
                var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = budgets.CreateBudget(userId, budgetRequest);
                budgets.CalculateBudgetIncomes(userId, response, incomes.GetIncomeByBudgetId("userId", response));
                budgets.CalculateBudgetCategories(userId, response, categories.GetCategoriesByBudgetId("userId", response));
                return Ok(response);
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
                var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                if (budgetRequest.Id is not null)
                {
                    budgets.CalculateBudgetIncomes(userId, budgetRequest.Id ?? 0, incomes.GetIncomeByBudgetId("userId", budgetRequest.Id ?? 0));
                    budgets.CalculateBudgetCategories(userId, budgetRequest.Id ?? 0, categories.GetCategoriesByBudgetId("userId", budgetRequest.Id ?? 0));
                    return Ok(budgets.UpdateBudget(userId, budgetRequest));
                }
                return BadRequest();
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
                var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                incomes.DeleteIncomesForBudget(userId, budgetId);
                categories.DeleteCategoriesForBudget(userId, budgetId);
                return Ok(budgets.DeleteBudgetById(userId, budgetId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }
    }
}
