using Breeze.Api.Categories;
using Breeze.Api.Expenses.RequestResponseObjects;
using Breeze.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web;

namespace Breeze.Api.Expenses
{
    [Authorize]
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
                var userId = User.GetObjectId();
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

        [HttpGet("/budgets/{budgetID}/expenses")]
        public IActionResult GetAllExpensesForUser([FromRoute] int BudgetID)
        {
            try
            {
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(expenses.GetExpensesForBudget(userId, BudgetID));
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
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = expenses.CreateExpense(userId, expenseRequest);
                var expenseList = expenses.GetExpenseByCategoryId(userId, expenseRequest.CategoryId);
                if (expenseList == null)
                {
                    return BadRequest("Expenses not found");
                }
                categories.CalculateCategoryExpenses(userId, expenseRequest.CategoryId, expenseList);
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
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = expenses.UpdateExpense(userId, expenseRequest);
                var expenseList = expenses.GetExpenseByCategoryId(userId, expenseRequest.CategoryId);
                if (expenseList == null)
                {
                    return BadRequest("Expenses not found");
                }
                categories.CalculateCategoryExpenses(userId, expenseRequest.CategoryId, expenseList);
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
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var expense = expenses.GetExpenseById(userId, id);
                if (expense == null)
                {
                    return BadRequest("Expense not found");
                }
                int categoryId = expense.CategoryId;
                var response = expenses.DeleteExpenseById(userId, id);
                var expenseList = expenses.GetExpenseByCategoryId(userId, categoryId);
                if (expenseList == null)
                {
                    return BadRequest("Expenses not found");
                }
                categories.CalculateCategoryExpenses(userId, categoryId, expenseList);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
