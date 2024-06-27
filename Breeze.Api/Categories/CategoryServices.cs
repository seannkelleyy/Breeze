using Breeze.Api.Categories.RequestResponseObjects;
using Breeze.Api.Expenses.RequestResponseObjects;
using Breeze.Data;
using Breeze.Domain;

namespace Breeze.Api.Categories
{
    /// <summary>
    /// Service for managing categories.
    /// </summary>
    public class CategoryService
    {
        private IConfiguration _config;
        private readonly ILogger _logger;
        private readonly BreezeContext db;

        /// <summary>
        /// Initializes a new instance of the <see cref="CategoryService"/> class.
        /// </summary>
        /// <param name="config">Configuration interface.</param>
        /// <param name="dbContext">Database context for Breeze.</param>
        /// <param name="logger">Logger for logging errors and information.</param>
        public CategoryService(IConfiguration config, BreezeContext dbContext, ILogger logger)
        {
            _config = config;
            _logger = logger;
            db = dbContext;
        }

        /// <summary>
        /// Retrieves a category by its ID.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="categoryId">The category's identifier.</param>
        /// <returns>A category response object or null if not found.</returns>
        public CategoryResponse? GetCategoryById(string userId, int categoryId)
        {
            try
            {
                return db.Categories
                    .Where(category => category.Id.Equals(categoryId) && category.UserId.Equals(userId))
                    .Select(category => new CategoryResponse
                    {
                        Id = category.Id,
                        UserId = category.UserId,
                        Name = category.Name,
                        Allocation = category.Allocation,
                        CurrentSpend = category.CurrentSpend,
                        BudgetId = category.BudgetId,
                    })
                    .First();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        /// <summary>
        /// Retrieves categories using their budget ID.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="categoryId">The category's identifier.</param>
        /// <returns>A category response object or null if not found.</returns>
        public List<CategoryResponse>? GetCategoriesByBudgetId(string userId, int budgetId)
        {
            try
            {
                return db.Categories
                    .Where(category => category.BudgetId.Equals(budgetId) && category.UserId.Equals(userId))
                    .Select(category => new CategoryResponse
                    {
                        Id = category.Id,
                        UserId = category.UserId,
                        Name = category.Name,
                        Allocation = category.Allocation,
                        CurrentSpend = category.CurrentSpend,
                        BudgetId = category.BudgetId,
                    })
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        /// <summary>
        /// Creates a new category.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="newCategory">The new category to create.</param>
        /// <returns>
        /// The ID of the created category, or one of the following error codes:
        /// -1: Cannot find foreign key dependency item.
        /// -5: Unknown error.
        /// </returns>
        public int CreateCategory(string userId, CategoryRequest newCategory)
        {
            try
            {
                var budget = db.Budgets.Where(budget => budget.Id.Equals(newCategory.BudgetId)).FirstOrDefault();
                if (budget is null)
                {
                    return -1;
                }
                Category category = new Category
                {
                    UserId = userId,
                    Name = newCategory.Name,
                    Allocation = newCategory.Allocation,
                    CurrentSpend = newCategory.CurrentSpend,
                    BudgetId = budget.Id,
                };
                db.Categories.Add(category);
                db.SaveChanges();
                return category.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Updates an existing category.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="updatedCategory">The updated category information.</param>
        /// <returns>
        /// The ID of the updated category or the following codes:
        /// -4 if the user doesn't match.
        /// -5 for an unknown error.
        /// </returns>
        public int UpdateCategory(string userId, CategoryRequest updatedCategory)
        {
            var category = db.Categories.Find(updatedCategory.Id);
            if (category is null)
            {
                return -2;
            }
            if (!category.UserId.Equals(userId))
            {
                return -4;
            }
            try
            {
                category.Name = updatedCategory.Name;
                category.Allocation = updatedCategory.Allocation;
                category.CurrentSpend = updatedCategory.CurrentSpend;
                db.Categories.Update(category);
                db.SaveChanges();
                return category.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Deletes a category by its ID.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="categoryId">The category's identifier.</param>
        /// <returns>
        /// The ID of the deleted category, or one of the following error codes:
        /// -2: Cannot find item.
        /// -5: Unknown error.
        /// </returns>
        public int DeleteCategoryById(string userId, int categoryId)
        {
            try
            {
                var category = db.Categories.Find(categoryId);
                if (category is null)
                {
                    return -2;
                }
                if (!category.UserId.Equals(userId))
                {
                    return -4;
                }
                db.Categories.Remove(category);
                db.SaveChanges();
                return categoryId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Deletes all categories associated with a given budget.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="budgetId">The budget's identifier.</param>
        /// <returns>
        /// The ID of the budget whose categories were deleted or the following codes:
        /// -2 if there is nothing to delete.
        /// -5 for an unknown error.
        /// </returns>
        public int DeleteCategoriesForBudget(string userId, int budgetId)
        {
            try
            {
                List<Category> categories = (List<Category>)db.Categories.Where(category => category.BudgetId.Equals(budgetId) && category.UserId.Equals(userId));
                if (categories is null || categories.Count().Equals(0))
                {
                    return -2;
                }
                db.Categories.RemoveRange(categories);
                db.SaveChanges();
                return budgetId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Recalculates the amount spent for a specified category when adding an expense.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="categoryId">The category's identifier to which expenses are added.</param>
        /// <param name="expenses">The list of expenses to add.</param>
        /// <returns>
        /// The ID of the category to which expenses were added, or one of the following error codes:
        /// -2: Cannot find the category.
        /// -4: User ID does not match.
        /// -5: Unknown error.
        /// </returns>
        public int CalculateCategoryExpenses(string userId, int categoryId, List<ExpenseResponse> expenses)
        {
            try
            {
                var existingCategory = db.Categories.Find(categoryId);
                if (existingCategory is null)
                {
                    return -2;
                }
                if (!existingCategory.UserId.Equals(userId))
                {
                    return -4;
                }

                var amountSpent = expenses.Sum(expense => expense.Amount);

                existingCategory.CurrentSpend = amountSpent;
                db.SaveChanges();
                return existingCategory.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }
    }
}
