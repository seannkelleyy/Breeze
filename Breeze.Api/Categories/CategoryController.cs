using System.Threading.Tasks;
using Breeze.Api.Budgets;
using Breeze.Api.Categories.RequestResponseObjects;
using Breeze.Api.Expenses;
using Breeze.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web;

namespace Breeze.Api.Categories
{
    [Authorize]
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

        [HttpGet]
        public IActionResult GetCategoriesByBudgetId([FromRoute] int budgetId)
        {
            try
            {
                var userId = User.GetObjectId();
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
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = categories.CreateCategory(userId, categoryRequest);
                var categoryList = categories.GetCategoriesByBudgetId(userId, categoryRequest.BudgetId);
                if (categoryList == null)
                {
                    _logger.LogError($"Category list is null for user {userId} and budget {categoryRequest.BudgetId}");
                    return BadRequest("Category list is null");
                }
                budgets.CalculateBudgetCategories(userId, categoryRequest.BudgetId, categoryList);
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
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var response = categories.UpdateCategory(userId, categoryRequest);
                var categoryList = categories.GetCategoriesByBudgetId(userId, categoryRequest.BudgetId);
                if (categoryList == null)
                {
                    _logger.LogError($"Category list is null for user {userId} and budget {categoryRequest.BudgetId}");
                    return BadRequest("Category list is null");
                }
                budgets.CalculateBudgetCategories(userId, categoryRequest.BudgetId, categoryList);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpDelete("{categoryId}")]
        public async Task<IActionResult> DeleteCategory([FromRoute] int categoryId)
        {
            try
            {
                var userId = User.GetObjectId();
                if (userId == null)
                {
                    _logger.LogError(User.ToString());
                    return Unauthorized();
                }
                var category = categories.GetCategoryById(userId, categoryId);
                if (category == null)
                {
                    _logger.LogError($"Category not found for user {userId} and category {categoryId}");
                    return NotFound("Category not found");
                }
                int budgetId = category.BudgetId;
                expenses.DeleteExpenseForCategory(userId, categoryId);
                var response = categories.DeleteCategoryById(userId, categoryId);
                if (response < 0)
                {
                    _logger.LogError($"Failed to delete category {categoryId}");
                    return BadRequest("Failed to delete category. Code: " + response);
                }
                var categoryList = categories.GetCategoriesByBudgetId(userId, budgetId);
                if (categoryList == null)
                {
                    _logger.LogError($"Category list is null for user {userId} and budget {budgetId}");
                    return BadRequest("Category list is null");
                }
                budgets.CalculateBudgetCategories(userId, budgetId, categoryList);
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
