using Breeze.Api.RequestResponseObjects.Categories;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly CategoryService categories;
        private readonly ExpenseService expenses;
        private readonly ILogger<CategoryController> _logger;

        public CategoryController(IConfiguration config, ILogger<CategoryController> logger, BreezeContext breezeContext)
        {
            categories = new CategoryService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet]
        public IActionResult GetCategoryByBudgetId(int budgetId)
        {
            try
            {
                return Ok(categories.GetCategoryByBudgetId(budgetId));
            } catch (Exception ex)
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
                return Ok(categories.CreateCategory(categoryRequest));
            } catch (Exception ex)
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
                return Ok(categories.UpdateCategory(categoryRequest));
            } catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpDelete]
        public IActionResult DeleteCategory(int id)
        {
            try
            {
                expenses.DeleteExpenseForCategory(id);
                return Ok(categories.DeleteCategory(id));
            } catch (Exception ex)
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
                return Ok(categories.DeleteCategoriesForBudget(budgetId));
            } catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

    }
}
