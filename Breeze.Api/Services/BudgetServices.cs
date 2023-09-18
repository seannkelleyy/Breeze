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

        public BudgetResponse GetBudget(string userId, DateTime date)
        {
            return db.Budgets
                .Where(budget => budget.User.UserId == userId && budget.Date.Month == date.Month && budget.Date.Year == date.Year)
                .Select(budget => new BudgetResponse
                {
                    UserId = budget.User.UserId,
                    Date = budget.Date,
                    MonthlyIncome = budget.MonthlyIncome,
                    MonthlySaving = budget.MonthlySaving,
                    Categories = budget.Categories,
                    Income = budget.Income,
                })
                .First();
        }

        public DateOnly? CreateBudget(BudgetRequest newBudget)
        {
            try
            {
                var user = db.Users.Where(user => user.UserId == newBudget.UserId).FirstOrDefault();
                db.Budgets.Add(new Budget
                {
                    User = user,
                    Date = newBudget.Date,
                    MonthlyIncome = newBudget.MonthlyIncome,
                    MonthlySaving = newBudget.MonthlySaving,

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

        public DateOnly? UpdateBudget(BudgetRequest updatedBudget)
        {
            var existingBudget = db.Budgets.Find(updatedBudget.Id);
            try
            {
                existingBudget.MonthlyIncome = updatedBudget.MonthlyIncome;
                existingBudget.MonthlySaving = updatedBudget.MonthlySaving;
                db.Budgets.Update(existingBudget);
                return new DateOnly(updatedBudget.Date.Year, updatedBudget.Date.Month, updatedBudget.Date.Day);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return null;
            }
        }

        public int DeleteBudget(int budgetId)
        {

            //call function that removes all incomes with this budget id
            //call function that removes all categories with this budget id
            db.Budgets.Remove(db.Budgets.Find(budgetId));
            db.SaveChanges();
            return budgetId;
        }
    }
}
