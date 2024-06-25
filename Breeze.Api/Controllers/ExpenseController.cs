using Breeze.Api.RequestResponseObjects.Expenses;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("/budgets/{budgetId}/categories/{categoryId}/expenses")]
    public class ExpenseController : ControllerBase
    {
        private readonly CategoryService categories;
        private readonly ExpenseService expenses;
        private readonly ILogger<ExpenseController> _logger;

        public ExpenseController(IConfiguration config, ILogger<ExpenseController> logger, BreezeContext breezeContext)
        {
            categories = new CategoryService(config, breezeContext, logger);
            expenses = new ExpenseService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet]
        public IActionResult GetExpensesForCategory([FromRoute] int CategoryId)
        {
            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(expenses.GetExpenseByCategoryId(userId, CategoryId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public IActionResult PostExpsense(ExpenseRequest expenseRequest)
        {
            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = expenses.CreateExpense(userId, expenseRequest);
                categories.CalculateCategoryExpenses(userId, expenseRequest.CategoryId, expenses.GetExpenseByCategoryId(userId, expenseRequest.CategoryId));
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch]
        public IActionResult PatchExpsense([FromBody] ExpenseRequest expenseRequest)
        {
            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = expenses.UpdateExpense(userId, expenseRequest);
                categories.CalculateCategoryExpenses(userId, expenseRequest.CategoryId, expenses.GetExpenseByCategoryId(userId, expenseRequest.CategoryId));
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteExpsense([FromRoute] int id)
        {
            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                int categoryId = expenses.GetExpenseById(userId, id).CategoryId;
                if (categoryId == 0)
                {
                    return BadRequest("Expense not found");
                }
                var response = expenses.DeleteExpenseById(userId, id);
                categories.CalculateCategoryExpenses(userId, categoryId, expenses.GetExpenseByCategoryId(userId, categoryId));
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
