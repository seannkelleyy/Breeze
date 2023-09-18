using Breeze.Api.RequestResponseObjects.Budgets;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
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

        [HttpGet]
        public IActionResult GetBudget(string UserId, DateTime date)
        {
            try
            {
                return Ok(budgets.GetBudget(UserId, date));
            } catch (Exception ex)
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
            } catch(Exception ex)
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
                return Ok(budgets.UpdateBudget(budgetRequest));
            } catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpDelete]
        public IActionResult DeleteBudget(int budgetId)
        {
            try
            {
                incomes.DeleteIncomesForBudget(budgetId);
                categories.DeleteCategoriesForBudget(budgetId);
                return Ok(budgets.DeleteBudget(budgetId));
            } catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }
    }
}
