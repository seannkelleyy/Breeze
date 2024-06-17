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

        [HttpGet("{id}")]
        public IActionResult GetExpense([FromRoute] int id)
        {
            try
            {
                //var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                //if (userId == null)
                //{
                //    _logger.LogError(User.ToString());
                //    return Unauthorized();
                //}
                return Ok(expenses.GetExpenseById("userId", id));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to get Expense, error code: {ex.Message}");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        public IActionResult GetExpensesForCategory([FromRoute] int CategoryId)
        {
            try
            {
                //var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                //if (userId == null)
                //{
                //    _logger.LogError(User.ToString());
                //    return Unauthorized();
                //}
                return Ok(expenses.GetExpenseByCategoryId("userId", CategoryId));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to get Incomes, error code: {ex.Message}");
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public IActionResult PostExpsense(ExpenseRequest expenseRequest)
        {
            try
            {
                //var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                //if (userId == null)
                //{
                //    _logger.LogError(User.ToString());
                //    return Unauthorized();
                //}
                var response = expenses.CreateExpense("userId", expenseRequest);
                categories.CalculateCategoryExpenses("userId", expenseRequest.CategoryId, expenses.GetExpenseByCategoryId("userId", expenseRequest.CategoryId));
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
                //var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                //if (userId == null)
                //{
                //    _logger.LogError(User.ToString());
                //    return Unauthorized();
                //}

                var response = expenses.UpdateExpense("userId", expenseRequest);
                categories.CalculateCategoryExpenses("userId", expenseRequest.CategoryId, expenses.GetExpenseByCategoryId("userId", expenseRequest.CategoryId));
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteExpsense(int id)
        {
            try
            {
                //var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                //if (userId == null)
                //{
                //    _logger.LogError(User.ToString());
                //    return Unauthorized();
                //}
                int categoryId = expenses.GetExpenseById("userId", id).CategoryId;
                if (categoryId == 0)
                {
                    return BadRequest("Expense not found");
                }
                var response = expenses.DeleteExpenseById("userId", id);
                categories.CalculateCategoryExpenses("userId", categoryId, expenses.GetExpenseByCategoryId("userId", categoryId));
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete]
        public IActionResult DeleteExpensesForCategory([FromRoute] int categoryId)
        {
            try
            {
                //var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                //if (userId == null)
                //{
                //    _logger.LogError(User.ToString());
                //    return Unauthorized();
                //}
                expenses.DeleteExpenseForCategory("userId", categoryId);
                categories.CalculateCategoryExpenses("userId", categoryId, expenses.GetExpenseByCategoryId("userId", categoryId));
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
