using Breeze.Api.RequestResponseObjects.Budgets;
using Breeze.Data;
using Breeze.Domain;

namespace Breeze.Api.Services
{
    /// <summary>
    /// Service for managing budgets.
    /// </summary>
    public class BudgetService
    {
        private IConfiguration _config;
        private readonly ILogger _logger;
        private readonly BreezeContext db;

        /// <summary>
        /// Initializes a new instance of the <see cref="BudgetService"/> class.
        /// </summary>
        /// <param name="config">Configuration interface.</param>
        /// <param name="dbContext">Database context for Breeze.</param>
        /// <param name="logger">Logger for logging errors and information.</param>
        public BudgetService(IConfiguration config, BreezeContext dbContext, ILogger logger)
        {
            _config = config;
            _logger = logger;
            db = dbContext;
        }

        /// <summary>
        /// Retrieves a budget for a specified user, year, and month.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="year">The year of the budget.</param>
        /// <param name="month">The month of the budget.</param>
        /// <returns>A budget response object or null if not found.</returns>
        public BudgetResponse? GetBudgetByDate(string userId, int year, int month)
        {
            try
            {
                return db.Budgets
                    .Where(budget => budget.UserId.Equals(userId) && budget.Month == month && budget.Year == year)
                    .Select(budget => new BudgetResponse
                    {
                        Id = budget.Id,
                        UserId = budget.UserId,
                        MonthlyIncome = budget.MonthlyIncome,
                        MonthlyExpenses = budget.MonthlyExpenses,
                        Year = budget.Year,
                        Month = budget.Month,
                        Categories = budget.Categories,
                        Income = budget.Income,
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
        /// Creates a new budget for a user.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="newBudget">The budget request object containing the new budget details.</param>
        /// <returns>
        /// The ID of the created budget, or -5 for an unknown error.
        /// </returns>
        public int CreateBudget(string userId, BudgetRequest newBudget)
        {
            try
            {
                var existingBudget = GetBudgetByDate(userId, newBudget.Year, newBudget.Month);
                if (existingBudget != null)
                {
                    return existingBudget.Id;
                }
                db.Budgets.Add(new Budget
                {
                    UserId = userId,
                    MonthlyIncome = newBudget.MonthlyIncome,
                    MonthlyExpenses = newBudget.MonthlyExpenses,
                    Year = newBudget.Year,
                    Month = newBudget.Month

                });
                db.SaveChanges();
                return 1;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Updates an existing budget for a user.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="updatedBudget">The budget request object containing the updated budget details.</param>
        /// <returns>
        /// The ID of the updated budget, or one of the following error codes:
        /// -2: Cannot find item.
        /// -4: Unauthorized access.
        /// -5: Unknown error.
        /// </returns>
        public int UpdateBudget(string userId, BudgetRequest updatedBudget)
        {
            try
            {
                var existingBudget = db.Budgets.Find(updatedBudget.Id);
                if (existingBudget is null)
                {
                    return -2;
                }
                if (!existingBudget.UserId.Equals(userId))
                {
                    return -4;
                }
                existingBudget.MonthlyIncome = updatedBudget.MonthlyIncome;
                existingBudget.MonthlyExpenses = updatedBudget.MonthlyExpenses;
                db.Budgets.Update(existingBudget);
                db.SaveChanges();
                return existingBudget.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Deletes a budget by its ID for a specified user.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="budgetId">The budget's identifier.</param>
        /// <returns>
        /// The ID of the deleted budget, or one of the following error codes:
        /// -2: Cannot find item.
        /// -4: Unauthorized access.
        /// -5: Unknown error.
        /// </returns>
        public int DeleteBudgetById(string userId, int budgetId)
        {
            try
            {
                var budget = db.Budgets.Find(budgetId);
                if (budget == null)
                {
                    return -2;
                }
                if (!budget.UserId.Equals(userId))
                {
                    return -4;
                }
                db.Budgets.Remove(budget);
                db.SaveChanges();
                return budgetId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }

        }
    }
}
