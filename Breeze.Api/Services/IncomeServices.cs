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

        public List<IncomeResponse> GetIncomeByBudgetId(int budgetId)
        {
            return db.Incomes
                .Where(income => income.Budget.Id == budgetId)
                .Select(income => new IncomeResponse
                {
                    Id = income.Id,
                    UserEmail = income.User.UserEmail,
                    Name = income.Name,
                    Date = DateTime.Now,
                    BudgetId = income.Budget.Id,
                    Amount = income.Amount,
                })
                .ToList();
        }

        public int CreateIncome(IncomeRequest newIncome)
        {
            Income income;
            try
            {
                var budget = db.Budgets.Find(newIncome.BudgetId);
                var user = db.Users.Find(newIncome.UserEmail);
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

        public int UpdateIncome(IncomeRequest updatedIncome)
        {
            var income = db.Incomes.Find(updatedIncome.Id);
            if (income == null)
            {
                return -1;
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

        public int DeleteIncome(int incomeId)
        {
            var income = db.Incomes.Find(incomeId);
            if (income == null)
            {
                return -1;
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
