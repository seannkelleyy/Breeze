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

        public IncomeResponse GetIncomeById(string userEmail, int incomeId)
        {
            return db.Incomes
                .Where(income => income.Id == incomeId && income.UserEmail.Equals(userEmail))
                .Select(income => new IncomeResponse
                {
                    Id = income.Id,
                    UserId = income.UserEmail,
                    Name = income.Name,
                    Year = income.Year,
                    Month = income.Month,
                    Day = income.Day,
                    BudgetId = income.Budget.Id,
                    Amount = income.Amount,
                }).First();
        }
        public List<IncomeResponse> GetIncomeByBudgetId(string userEmail, int budgetId)
        {
            return db.Incomes
                .Where(income => income.Budget.Id == budgetId && income.UserEmail.Equals(userEmail))
                .Select(income => new IncomeResponse
                {
                    Id = income.Id,
                    UserId = income.UserEmail,
                    Name = income.Name,
                    Year = income.Year,
                    Month = income.Month,
                    Day = income.Day,
                    BudgetId = income.Budget.Id,
                    Amount = income.Amount,
                })
                .ToList();
        }

        public int CreateIncome(string userEmail, IncomeRequest newIncome)
        {
            Income income;
            try
            {
                var budget = db.Budgets.Find(newIncome.BudgetId);
                if (budget == null)
                {
                    return -1;
                }
                income = new Income
                {
                    UserEmail = userEmail,
                    Name = newIncome.Name,
                    Year = newIncome.Year,
                    Month = newIncome.Month,
                    Day = newIncome.Day,
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

        public int UpdateIncome(string userEmail, IncomeRequest updatedIncome)
        {
            var income = db.Incomes.Find(updatedIncome.Id);
            if (income == null)
            {
                return -1;
            }
            if (income.UserEmail != userEmail)
            {
                return -2;
            }
            try
            {
                income.Name = updatedIncome.Name;
                income.Amount = updatedIncome.Amount;
                income.Year = updatedIncome.Year;
                income.Month = updatedIncome.Month;
                income.Day = updatedIncome.Day;
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

        public int DeleteIncome(string userEmail, int incomeId)
        {
            var income = db.Incomes.Find(incomeId);
            if (income == null)
            {
                return -1;
            }
            if (income.UserEmail != userEmail)
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
