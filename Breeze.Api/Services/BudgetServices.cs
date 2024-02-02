using Breeze.Api.RequestResponseObjects.Budgets;
using Breeze.Data;
using Breeze.Domain;

namespace Breeze.Api.Services
{
    public class BudgetService
    {
        private IConfiguration _config;
        private readonly ILogger _logger;
        private readonly BreezeContext db;

        public BudgetService(IConfiguration config, BreezeContext dbContext, ILogger logger)
        {
            _config = config;
            _logger = logger;
            db = dbContext;
        }

        public BudgetResponse GetBudget(string userId, int year, int month)
        {
            return db.Budgets
                .Where(budget => budget.User.UserId.Equals(userId) && budget.Date.Month == month && budget.Date.Year == year)
                .Select(budget => new BudgetResponse
                {
                    UserId = budget.User.UserId,
                    Date = budget.Date,
                    MonthlyIncome = budget.MonthlyIncome,
                    MonthlyExpenses = budget.MonthlyExpenses,
                    Categories = budget.Categories,
                    Income = budget.Income,
                })
                .First();
        }

        public DateOnly? CreateBudget(string userId, BudgetRequest newBudget)
        {
            try
            {
                var user = db.Users.Where(user => user.UserId.Equals(userId)).FirstOrDefault();
                if (user == null)
                {
                    return null;
                }
                db.Budgets.Add(new Budget
                {
                    User = user,
                    Date = newBudget.Date,
                    MonthlyIncome = newBudget.MonthlyIncome,
                    MonthlyExpenses = newBudget.MonthlyExpenses,

                });
                db.SaveChanges();
                return new DateOnly(newBudget.Date.Year, newBudget.Date.Month, newBudget.Date.Day);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        public DateOnly? UpdateBudget(string userId, BudgetRequest updatedBudget)
        {
            var existingBudget = db.Budgets.Find(updatedBudget.Id);
            if (existingBudget == null)
            {
                return null;
            }
            if (!existingBudget.User.UserId.Equals(userId))
            {
                return null;
            }
            try
            {
                existingBudget.MonthlyIncome = updatedBudget.MonthlyIncome;
                existingBudget.MonthlyExpenses = updatedBudget.MonthlyExpenses;
                db.Budgets.Update(existingBudget);
                db.SaveChanges();
                return new DateOnly(updatedBudget.Date.Year, updatedBudget.Date.Month, updatedBudget.Date.Day);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        public int DeleteBudget(string userId, int budgetId)
        {
            var budget = db.Budgets.Find(budgetId);
            if (budget == null)
            {
                return -1;
            }
            if (!budget.User.UserId.Equals(userId))
            {
                return -2;
            }
            try {
                db.Budgets.Remove(budget);
                db.SaveChanges();
                return budgetId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -1;
            }
          
        }
    }
}
