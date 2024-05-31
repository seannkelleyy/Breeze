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
                .Where(budget => budget.UserEmail.Equals(userId) && budget.Month == month && budget.Year == year)
                .Select(budget => new BudgetResponse
                {
                    UserEmail = budget.UserEmail,
                    MonthlyIncome = budget.MonthlyIncome,
                    MonthlyExpenses = budget.MonthlyExpenses,
                    Year = budget.Year,
                    Month = budget.Month,
                    Categories = budget.Categories,
                    Income = budget.Income,
                })
                .First();
        }

        public DateOnly? CreateBudget(string userEmail, BudgetRequest newBudget)
        {
            try
            {
                db.Budgets.Add(new Budget
                {
                    UserEmail = userEmail,
                    MonthlyIncome = newBudget.MonthlyIncome,
                    MonthlyExpenses = newBudget.MonthlyExpenses,
                    Year = newBudget.Year,
                    Month = newBudget.Month

                });
                db.SaveChanges();
                return new DateOnly(newBudget.Year, newBudget.Month, 1);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        public DateOnly? UpdateBudget(string userEmail, BudgetRequest updatedBudget)
        {
            var existingBudget = db.Budgets.Find(updatedBudget.Id);
            if (existingBudget == null)
            {
                return null;
            }
            if (!existingBudget.UserEmail.Equals(userEmail))
            {
                return null;
            }
            try
            {
                existingBudget.MonthlyIncome = updatedBudget.MonthlyIncome;
                existingBudget.MonthlyExpenses = updatedBudget.MonthlyExpenses;
                db.Budgets.Update(existingBudget);
                db.SaveChanges();
                return new DateOnly(updatedBudget.Year, updatedBudget.Month, new DateOnly().Day);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        public int DeleteBudget(string userEmail, int budgetId)
        {
            var budget = db.Budgets.Find(budgetId);
            if (budget == null)
            {
                return -1;
            }
            if (!budget.UserEmail.Equals(userEmail))
            {
                return -2;
            }
            try
            {
                db.Budgets.Remove(budget);
                db.SaveChanges();
                return budgetId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -3;
            }

        }
    }
}
