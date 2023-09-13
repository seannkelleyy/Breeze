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

        public IncomeResponse GetIncomeByBudgetId(int budgetId)
        {
            return db.Incomes
                .Where(income => income.BudgetId == budgetId)
                .Select(income => new IncomeResponse
                {
                    Id = income.Id,
                    UserId = income.UserId,
                    Name = income.Name,
                    Date = DateTime.Now,
                    BudgetId = income.BudgetId,
                    Amount = income.Amount,
                })
                .First();
        }

        public void CreateIncome(IncomeRequest newIncome)
        {
            try
            {
                db.Incomes.Add(new Income
                {
                    UserId = newIncome.UserId,
                    Name = newIncome.Name,
                    Date = DateTime.Now,
                    BudgetId = newIncome.BudgetId,
                    Amount = newIncome.Amount,
                });
                db.SaveChanges();
            }catch (Exception ex)
            {
                _logger.LogError(ex.Message);
            }
        }

        public void UpdateIncome(IncomeRequest updatedIncome)
        {
            var income = db.Incomes.Find(updatedIncome.Id);
            try
            {
                income.Name = updatedIncome.Name;
                income.Amount = updatedIncome.Amount;
                income.Date = updatedIncome.Date;
                db.Incomes.Update(income);
                db.SaveChanges();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
            }
        }

        public void DeleteIncome(int incomeId)
        {
            db.Incomes.Remove(db.Incomes.Find(incomeId));
            db.SaveChanges();
        }

        public void DeleteIncomesForBudget(int budgetId)
        {
            db.Incomes
                .RemoveRange(db.Incomes
                .Where(income => income.BudgetId == budgetId));
            db.SaveChanges();
        }
    }
}
