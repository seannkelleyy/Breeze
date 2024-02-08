using Breeze.Api.RequestResponseObjects.Expenses;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("/expeneses")]
    public class ExpenseController : ControllerBase
    {
        private readonly ExpenseService expenses;
        private readonly ILogger<ExpenseController> _logger;

        public ExpenseController(IConfiguration config, ILogger<ExpenseController> logger, BreezeContext breezeContext)
        {
            expenses = new ExpenseService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet("{categoryId}")]
        public IActionResult GetExpsense([FromRoute]int CategoryId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                return Ok(expenses.GetExpenseByCategoryId(userId, CategoryId));
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
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                return Ok(expenses.CreateExpense(userId, expenseRequest));
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
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                return Ok(expenses.UpdateExpense(userId, expenseRequest));
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
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                return Ok(expenses.DeleteExpense(userId, id));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{categoryId}")]
        public IActionResult DeleteExpsensesForCategory(int categoryId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
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
