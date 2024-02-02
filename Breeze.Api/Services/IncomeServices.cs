using Breeze.Api.RequestResponseObjects.Incomes;
using Breeze.Data;
using Breeze.Domain;

namespace Breeze.Api.Services
{
    public class IncomeService
    {
        private IConfiguration _config;
        private readonly ILogger _logger;
        private readonly BreezeContext db;

        public IncomeService(IConfiguration config, BreezeContext dbContext, ILogger logger)
        {
            _config = config;
            _logger = logger;
            db = dbContext;
        }

        public List<IncomeResponse> GetIncomeByBudgetId(string userId, int budgetId)
        {
            return db.Incomes
                .Where(income => income.Budget.Id == budgetId && income.User.UserId.Equals(userId))
                .Select(income => new IncomeResponse
                {
                    Id = income.Id,
                    UserId = income.User.UserId,
                    Name = income.Name,
                    Date = DateTime.Now,
                    BudgetId = income.Budget.Id,
                    Amount = income.Amount,
                })
                .ToList();
        }

        public int CreateIncome(string userId, IncomeRequest newIncome)
        {
            Income income;
            try
            {
                var budget = db.Budgets.Find(newIncome.BudgetId);
                var user = db.Users.Find(userId);
                if (budget == null || user == null)
                {
                    return -1;
                }
                income = new Income
                {
                    User = user,
                    Name = newIncome.Name,
                    Date = DateTime.Now,
                    Budget = budget,
                    Amount = newIncome.Amount,
                };
                db.Incomes.Add(income);
                db.SaveChanges();
                return income.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -1;
            }
        }

        public int UpdateIncome(string userId, IncomeRequest updatedIncome)
        {
            var income = db.Incomes.Find(updatedIncome.Id);
            if (income == null)
            {
                return -1;
            }
            if (income.User.UserId != userId)
            {
                return -2;
            }
            try
            {
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
                return -1;
            }
        }

        public int DeleteIncome(string userId, int incomeId)
        {
            var income = db.Incomes.Find(incomeId);
            if (income == null)
            {
                return -1;
            }
            if (income.User.UserId != userId)
            {
                return -2;
            }
            db.Incomes.Remove(income);
            db.SaveChanges();
            return incomeId;
        }

        public void DeleteIncomesForBudget(int budgetId)
        {
            db.Incomes
                .RemoveRange(db.Incomes
                .Where(income => income.Budget.Id == budgetId));
            db.SaveChanges();
        }
    }
}
