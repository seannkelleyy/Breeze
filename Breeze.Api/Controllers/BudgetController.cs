using Breeze.Api.RequestResponseObjects.Budgets;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("/users/{email}/budgets")]
    public class BudgetController : ControllerBase
    {
        private readonly BudgetService budgets;
        private readonly CategoryService categories;
        private readonly IncomeService incomes;
        private readonly ExpenseService expenses;
        private readonly ILogger<BudgetController> _logger;

        public BudgetController(IConfiguration config, ILogger<BudgetController> logger, BreezeContext breezeContext)
        {
            budgets = new BudgetService(config, breezeContext, logger);
            categories = new CategoryService(config, breezeContext, logger);
            incomes = new IncomeService(config, breezeContext, logger);
            expenses = new ExpenseService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet("{year}/{month}")]
        public IActionResult GetBudget([FromRoute] string email, [FromRoute] int year, [FromRoute] int month)
        {
            try
            {
                return Ok(budgets.GetBudget(email, year, month));
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
                return Ok(budgets.CreateBudget(budgetRequest));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpPatch("{id}")]
        public IActionResult PatchBudget([FromRoute] int budgetId, BudgetRequest budgetRequest)
        {
            try
            {
                return Ok(budgets.UpdateBudget(budgetId, budgetRequest));
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
                incomes.DeleteIncomesForBudget(budgetId);
                categories.DeleteCategoriesForBudget(budgetId);
                return Ok(budgets.DeleteBudget(budgetId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }
    }
}
