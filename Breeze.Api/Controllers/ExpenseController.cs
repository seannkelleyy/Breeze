using Breeze.Api.RequestResponseObjects.Expenses;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ExpenseController : ControllerBase
    {
        private readonly ExpenseService expenses;
        private readonly ILogger<ExpenseController> _logger;

        public ExpenseController(IConfiguration config, ILogger<ExpenseController> logger, BreezeContext breezeContext)
        {
            expenses = new ExpenseService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet]
        public IActionResult GetExpsense(int CategoryId)
        {
            try
            {
                return Ok(expenses.GetExpenseByCategoryId(CategoryId));
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
                return Ok(expenses.CreateExpense(expenseRequest));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch]

        public async Task<IActionResult> PatchExpsense(int id, [FromBody] ExpenseRequest expenseRequest)
        {
            try
            {
                return Ok(expenses.UpdateExpense(expenseRequest));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete]
        public IActionResult DeleteExpsense(int id)
        {
            try
            {
                return Ok(expenses.DeleteExpense(id));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete]
        public IActionResult DeleteExpsensesForCategory(int categoryId)
        {
            try
            {
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
