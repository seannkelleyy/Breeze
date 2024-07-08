using Breeze.Api.Incomes.RequestResponseObjects;
using Breeze.Data;
using Breeze.Domain;

namespace Breeze.Api.Incomes
{
    /// <summary>
    /// Service for managing incomes.
    /// </summary>
    public class IncomeService
    {
        private IConfiguration _config;
        private readonly ILogger _logger;
        private readonly BreezeContext db;

        /// <summary>
        /// Initializes a new instance of the <see cref="IncomeService"/> class.
        /// </summary>
        /// <param name="config">Configuration interface.</param>
        /// <param name="dbContext">Database context for Breeze.</param>
        /// <param name="logger">Logger for logging errors and information.</param>
        public IncomeService(IConfiguration config, BreezeContext dbContext, ILogger logger)
        {
            _config = config;
            _logger = logger;
            db = dbContext;
        }

        /// <summary>
        /// Retrieves an income by its ID.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="incomeId">The income's identifier.</param>
        /// <returns>An income response object or null if not found.</returns>
        public IncomeResponse? GetIncomeById(string userId, int incomeId)
        {
            try
            {
                return db.Incomes
                    .Where(income => income.Id.Equals(incomeId) && income.UserId.Equals(userId))
                    .Select(income => new IncomeResponse
                    {
                        Id = income.Id,
                        UserId = income.UserId,
                        Name = income.Name,
                        Date = income.Date,
                        BudgetId = income.BudgetId,
                        Amount = income.Amount,
                    }).First();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        /// <summary>
        /// Retrieves all incomes for a given budget.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="budgetId">The budget's identifier.</param>
        /// <returns>A list of income response objects or null if an error occurs.</returns>
        public List<IncomeResponse>? GetIncomesByBudgetId(string userId, int budgetId)
        {
            try
            {
                List<IncomeResponse> items = db.Incomes
                    .Where(income => income.BudgetId.Equals(budgetId) && income.UserId.Equals(userId))
                    .Select(income => new IncomeResponse
                    {
                        Id = income.Id,
                        UserId = income.UserId,
                        Name = income.Name,
                        Date = income.Date,
                        BudgetId = income.BudgetId,
                        Amount = income.Amount,
                    })
                    .ToList();
                if (items != null)
                {
                    return items;
                }
                return [];

            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        /// <summary>
        /// Creates a new income.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="newIncome">The new income to create.</param>
        /// <returns>
        /// The ID of the created income, or one of the following error codes:
        /// -1: Cannot find foreign key dependency item.
        /// -5: Unknown error.
        /// </returns>
        public int CreateIncome(string userId, IncomeRequest newIncome)
        {
            try
            {
                var budget = db.Budgets.Find(newIncome.BudgetId);
                if (budget is null)
                {
                    return -1;
                }

                Income income = new Income
                {
                    UserId = userId,
                    Name = newIncome.Name,
                    Date = newIncome.Date,
                    BudgetId = budget.Id,
                    Amount = newIncome.Amount,
                };
                db.Incomes.Add(income);
                db.SaveChanges();
                return income.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Updates an existing income.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="updatedIncome">The updated income information.</param>
        /// <returns>
        /// The ID of the updated income, or one of the following error codes:
        /// -2: Cannot find item.
        /// -4: Unauthorized access.
        /// -5: Unknown error.
        /// </returns>
        public int UpdateIncome(string userId, IncomeRequest updatedIncome)
        {
            try
            {
                var income = db.Incomes.Find(updatedIncome.Id);
                if (income is null)
                {
                    return -2;
                }
                if (!income.UserId.Equals(userId))
                {
                    return -4;
                }
                income.Name = updatedIncome.Name;
                income.Amount = updatedIncome.Amount;
                income.Date = updatedIncome.Date;
                db.Incomes.Update(income);
                db.SaveChanges();
                return income.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Deletes an income by its ID.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="incomeId">The income's identifier.</param>
        /// <returns>
        /// The ID of the deleted income, or one of the following error codes:
        /// -2: Cannot find item.
        /// -4: Unauthorized access.
        /// -5: Unknown error.
        /// </returns>
        public int DeleteIncomeById(string userId, int incomeId)
        {
            try
            {
                var income = db.Incomes.Find(incomeId);
                if (income is null)
                {
                    return -2;
                }
                if (!income.UserId.Equals(userId))
                {
                    return -4;
                }
                db.Incomes.Remove(income);
                db.SaveChanges();
                return incomeId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -5;
            }
        }

        /// <summary>
        /// Deletes all incomes associated with a given budget.
        /// </summary>
        /// <param name="userId">The user's identifier.</param>
        /// <param name="budgetId">The budget's identifier.</param>
        /// <returns>
        /// The ID of the budget whose incomes were deleted, or -4 for unauthorized access, or -5 for an unknown error.
        /// </returns>
        public int DeleteIncomesForBudget(string userId, int budgetId)
        {
            try
            {
                List<Income> incomes = (List<Income>)db.Incomes
                    .Where(income => income.BudgetId.Equals(budgetId) && income.UserId.Equals(userId));
                if (incomes is null || incomes.Count().Equals(0))
                {
                    return -2;
                }
                db.Incomes.RemoveRange(incomes);
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
