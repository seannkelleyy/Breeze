using Breeze.Api.RequestResponseObjects.Categories;
using Breeze.Api.Services;
using Breeze.Data;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Breeze.Api.Controllers
{
    [ApiController]
    [Route("/budgets/{budgetId}/categories")]
    public class CategoryController : ControllerBase
    {
        private readonly CategoryService categories;
        private readonly ExpenseService expenses;
        private readonly ILogger<CategoryController> _logger;

        public CategoryController(IConfiguration config, ILogger<CategoryController> logger, BreezeContext breezeContext)
        {
            categories = new CategoryService(config, breezeContext, logger);
            expenses = new ExpenseService(config, breezeContext, logger);
            _logger = logger;
        }

        [HttpGet("{id}")]
        public IActionResult GetCategory([FromRoute] int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                return Ok(categories.GetCategory(userId, id));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpGet]
        public IActionResult GetCategories([FromRoute] int budgetId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                return Ok(categories.GetCategories(userId, budgetId));
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
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                return Ok(categories.CreateCategory(userId, categoryRequest));
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
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                return Ok(categories.UpdateCategory(userId, categoryRequest));
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
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                expenses.DeleteExpenseForCategory(id);
                return Ok(categories.DeleteCategory(userId, id));
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
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }
                return Ok(categories.DeleteCategoriesForBudget(budgetId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

    }
}
