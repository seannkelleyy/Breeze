using Breeze.Api.RequestResponseObjects.Expenses;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("/budgets/{budgetId}/categories/{categoryId}/expenses")]
    public class ExpenseController : ControllerBase
    {
        private readonly ExpenseService expenses;
        private readonly ILogger<ExpenseController> _logger;

        public ExpenseController(IConfiguration config, ILogger<ExpenseController> logger, BreezeContext breezeContext)
        {
            expenses = new ExpenseService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet("{id}")]
        public IActionResult GetExpense([FromRoute] int id)
        {
            try
            {
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userEmail == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(expenses.GetExpenseById(userEmail, id));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to get Expense, error code: {ex.Message}");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        public IActionResult GetExpsenses([FromRoute] int CategoryId)
        {
            try
            {
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userEmail == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(expenses.GetExpenseByCategoryId(userEmail, CategoryId));
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
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userEmail == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(expenses.CreateExpense(userEmail, expenseRequest));
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
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userEmail == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(expenses.UpdateExpense(userEmail, expenseRequest));
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
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userEmail == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(expenses.DeleteExpense(userEmail, id));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete]
        public IActionResult DeleteExpsensesForCategory([FromRoute] int categoryId)
        {
            try
            {
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
                if (userEmail == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                expenses.DeleteExpenseForCategory(categoryId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
