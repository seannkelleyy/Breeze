using Breeze.Api.RequestResponseObjects.Budgets;
using Breeze.Api.RequestResponseObjects.Categories;
using Breeze.Api.RequestResponseObjects.Incomes;
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
                var budget = db.Budgets
                    .Where(b => b.UserId.Equals(userId) && b.Month == month && b.Year == year)
                    .FirstOrDefault();

                if (budget == null)
                {
                    // Create a new budget
                    Budget newBudget = new Budget
                    {
                        UserId = userId,
                        MonthlyIncome = 0,
                        MonthlyExpenses = 0,
                        Year = year,
                        Month = month
                    };
                    db.Budgets.Add(newBudget);
                    db.SaveChanges();
                    budget = newBudget;
                }

                // Convert to BudgetResponse
                var budgetResponse = new BudgetResponse
                {
                    Id = budget.Id,
                    UserId = budget.UserId,
                    MonthlyIncome = budget.MonthlyIncome,
                    MonthlyExpenses = budget.MonthlyExpenses,
                    Year = budget.Year,
                    Month = budget.Month,
                };

                return budgetResponse;
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
                Budget budget = new Budget
                {
                    UserId = userId,
                    MonthlyIncome = newBudget.MonthlyIncome,
                    MonthlyExpenses = newBudget.MonthlyExpenses,
                    Year = newBudget.Year,
                    Month = newBudget.Month

                };
                db.Budgets.Add(budget);
                db.SaveChanges();
                return budget.Id;
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

        /// <summary>
        /// Recalculates the total budget income when adding a new income.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="budgetId">The budget's identifier to which incomes are added.</param>
        /// <param name="incomes">The list of incomes to add.</param>
        /// <returns>
        /// The ID of the budget to which incomes were added, or one of the following error codes:
        /// -2: Cannot find the budget.
        /// -4: User ID does not match.
        /// -5: Unknown error.
        /// </returns>
        public int CalculateBudgetIncomes(string userId, int budgetId, List<IncomeResponse> incomes)
        {
            try
            {
                var existingBudget = db.Budgets.Find(budgetId);
                if (existingBudget is null)
                {
                    return -2;
                }
                if (!existingBudget.UserId.Equals(userId))
                {
                    return -4;
                }

                decimal totalIncome = 0;

                foreach (var income in incomes)
                {
                    totalIncome += income.Amount;
                }

                existingBudget.MonthlyIncome = totalIncome;

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
        /// Recalculates the total budget expenses when adding a new category.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="budgetId">The budget's identifier to which categories are added.</param>
        /// <param name="categories">The list of categories to add.</param>
        /// <returns>
        /// The ID of the budget to which categories were added, or one of the following error codes:
        /// -2: Cannot find the budget.
        /// -4: User ID does not match.
        /// -5: Unknown error.
        /// </returns>
        public int CalculateBudgetCategories(string userId, int budgetId, List<CategoryResponse> categories)
        {
            try
            {
                var existingBudget = db.Budgets.Find(budgetId);
                if (existingBudget is null)
                {
                    return -2;
                }
                if (!existingBudget.UserId.Equals(userId))
                {
                    return -4;
                }

                decimal totalExpenses = categories.Sum(category => category.Allocation);

                existingBudget.MonthlyExpenses = totalExpenses;

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
    }
}
