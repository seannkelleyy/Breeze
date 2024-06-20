using Breeze.Api.RequestResponseObjects.Categories;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("/budgets/{budgetId}/categories")]
    public class CategoryController : ControllerBase
    {
        private readonly BudgetService budgets;
        private readonly CategoryService categories;
        private readonly ExpenseService expenses;
        private readonly ILogger<CategoryController> _logger;

        public CategoryController(IConfiguration config, ILogger<CategoryController> logger, BreezeContext breezeContext)
        {
            budgets = new BudgetService(config, breezeContext, logger);
            categories = new CategoryService(config, breezeContext, logger);
            expenses = new ExpenseService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet("{id}")]
        public IActionResult GetCategory([FromRoute] int id)
        {
            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(categories.GetCategoryById(userId, id));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpGet]
        public IActionResult GetCategoriesByBudgetId([FromRoute] int budgetId)
        {
            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                return Ok(categories.GetCategoriesByBudgetId(userId, budgetId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpPost]
        public IActionResult PostCategory(CategoryRequest categoryRequest)
        {
            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = categories.CreateCategory(userId, categoryRequest);
                budgets.CalculateBudgetCategories(userId, categoryRequest.BudgetId, categories.GetCategoriesByBudgetId(userId, categoryRequest.BudgetId));
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpPatch]
        public IActionResult PatchCategory(CategoryRequest categoryRequest)
        {
            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = categories.UpdateCategory(userId, categoryRequest);
                budgets.CalculateBudgetCategories(userId, categoryRequest.BudgetId, categories.GetCategoriesByBudgetId(userId, categoryRequest.BudgetId));
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteCategory(int id)
        {
            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                int budgetId = categories.GetCategoryById(userId, id).BudgetId;
                var response = categories.DeleteCategoryById(userId, id);
                budgets.CalculateBudgetCategories(userId, budgetId, categories.GetCategoriesByBudgetId(userId, budgetId));
                expenses.DeleteExpenseForCategory(userId, id);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpDelete]
        public IActionResult DeleteCategoriesForBudget(int budgetId)
        {
            try
            {
                var userId = User.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = categories.DeleteCategoriesForBudget(userId, budgetId);
                budgets.CalculateBudgetCategories(userId, budgetId, categories.GetCategoriesByBudgetId(userId, budgetId));
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

    }
}
