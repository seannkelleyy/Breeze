using Breeze.Api.Categories;
using Breeze.Api.Categories.RequestResponseObjects;
using Breeze.Api.Expenses.RequestResponseObjects;
using Breeze.Data;
using Breeze.Domain;

namespace Breeze.Api.Expenses
{
    /// <summary>
    /// Service for managing expenses.
    /// </summary>
    public class ExpenseService
    {
        private IConfiguration _config;
        private readonly ILogger _logger;
        private readonly BreezeContext db;

        /// <summary>
        /// Initializes a new instance of the <see cref="ExpenseService"/> class.
        /// </summary>
        /// <param name="config">Configuration interface.</param>
        /// <param name="dbContext">Database context for Breeze.</param>
        /// <param name="logger">Logger for logging errors and information.</param>
        public ExpenseService(IConfiguration config, BreezeContext dbContext, ILogger logger)
        {
            _config = config;
            _logger = logger;
            db = dbContext;
        }

        /// <summary>
        /// Retrieves an expense by its ID.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="expenseId">The expense's identifier.</param>
        /// <returns>An expense response object or null if not found.</returns>
        public ExpenseResponse? GetExpenseById(string userId, int expenseId)
        {
            try
            {
                return db.Expenses
                    .Where(expense => expense.Id.Equals(expenseId) && expense.UserId.Equals(userId))
                    .Select(expense => new ExpenseResponse
                    {
                        Id = expense.Id,
                        UserId = expense.UserId,
                        Name = expense.Name,
                        Date = expense.Date,
                        CategoryId = expense.CategoryId,
                        Amount = expense.Amount,
                    }).First();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        /// <summary>
        /// Retrieves expenses by category ID.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="CategoryId">The category's identifier.</param>
        /// <returns>A list of expense response objects or null if an error occurs.</returns>
        public List<ExpenseResponse>? GetExpenseByCategoryId(string userId, int CategoryId)
        {
            try
            {
                return db.Expenses
                    .Where(expense => expense.CategoryId.Equals(CategoryId) && expense.UserId.Equals(userId))
                    .Select(expense => new ExpenseResponse
                    {
                        Id = expense.Id,
                        UserId = expense.UserId,
                        Name = expense.Name,
                        Date = expense.Date,
                        CategoryId = expense.CategoryId,
                        Amount = expense.Amount,
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
        /// Retrieves all expenses for a budget.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="BudgetId">The budget's identifier.</param>
        /// <returns>A list of expense response objects or null if an error occurs.</returns>
        public List<ExpenseResponse>? GetExpensesForBudget(string userId, int BudgetId)
        {
            try
            {
                CategoryService categoryService = new CategoryService(_config, db, _logger);
                List<CategoryResponse>? categories = categoryService.GetCategoriesByBudgetId(userId, BudgetId);
                if (categories == null)
                {
                    return null;
                }

                return db.Expenses
                    .Where(expense => expense.UserId.Equals(userId) && categories.Select(category => category.Id).Contains(expense.CategoryId))
                    .Select(expense => new ExpenseResponse
                    {
                        Id = expense.Id,
                        UserId = expense.UserId,
                        Name = expense.Name,
                        Date = expense.Date,
                        CategoryId = expense.CategoryId,
                        Amount = expense.Amount,
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
        /// Creates a new expense.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="newExpense">The new expense to create.</param>
        /// <returns>
        /// The ID of the created expense, or one of the following error codes:
        /// -1: Cannot find foreign key dependency item.
        /// -5: Unknown error.
        /// </returns>
        public int CreateExpense(string userId, ExpenseRequest newExpense)
        {
            try
            {
                var category = db.Categories.Find(newExpense.CategoryId);
                if (category is null)
                {
                    return -1;
                }
                Expense expense = new Expense
                {
                    UserId = userId,
                    Name = newExpense.Name,
                    Date = newExpense.Date,
                    CategoryId = category.Id,
                    Amount = newExpense.Amount,
                };

                db.Expenses.Add(expense);
                db.SaveChanges();
                return expense.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Updates an existing expense.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="updatedExpense">The updated expense information.</param>
        /// <returns>
        /// The ID of the updated expense, or one of the following error codes:
        /// -1: Cannot find foreign key dependency item.
        /// -4: Unauthorized access.
        /// -5: Unknown error.
        /// </returns>
        public int UpdateExpense(string userId, ExpenseRequest updatedExpense)
        {
            try
            {
                var expense = db.Expenses.Find(updatedExpense.Id);
                if (expense is null)
                {
                    return -2;
                }
                if (!expense.UserId.Equals(userId))
                {
                    return -4;
                }
                expense.Name = updatedExpense.Name;
                expense.Date = updatedExpense.Date;
                expense.Amount = updatedExpense.Amount;
                expense.CategoryId = updatedExpense.CategoryId;

                db.Expenses.Update(expense);
                db.SaveChanges();
                return expense.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Deletes an expense by its ID.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="expenseId">The expense's identifier.</param>
        /// <returns>
        /// The ID of the deleted expense, or one of the following error codes:
        /// -2: Cannot find item.
        /// -4: Unauthorized access.
        /// -5: Unknown error.
        /// </returns>
        public int DeleteExpenseById(string userId, int expenseId)
        {
            try
            {
                var expense = db.Expenses.Find(expenseId);
                if (expense is null)
                {
                    return -2;
                }
                if (!expense.UserId.Equals(userId))
                {
                    return -4;
                }
                db.Expenses.Remove(expense);
                db.SaveChanges();
                return expenseId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }

        }

        /// <summary>
        /// Deletes all expenses for a given category.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="categoryId">The category's identifier.</param>
        ///         /// <returns>
        /// The ID of the category of the deleted expense, or one of the following error codes:
        /// -2: Cannot find item.
        /// -5: Unknown error.
        /// </returns>
        public int DeleteExpenseForCategory(string userId, int categoryId)
        {
            try
            {
                List<Expense> expenses = (List<Expense>)db.Expenses
                    .Where(expense => expense.CategoryId.Equals(categoryId) && expense.UserId.Equals(userId));
                if (expenses is null || expenses.Count().Equals(0))
                {
                    return -2;
                }
                db.Expenses.RemoveRange(expenses);
                db.SaveChanges();
                return categoryId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }
    }
}
