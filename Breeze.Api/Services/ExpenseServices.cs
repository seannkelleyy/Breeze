using Breeze.Api.RequestResponseObjects.Expenses;
using Breeze.Domain;
using Breeze.Data;

namespace Breeze.Api.Services
{
    public class ExpenseService
    {
        private IConfiguration _config;
        private readonly ILogger _logger;
        private readonly BreezeContext db;

        public ExpenseService(IConfiguration config, BreezeContext dbContext, ILogger logger)
        {
            _config = config;
            _logger = logger;
            db = dbContext;
        }

        public List<ExpenseResponse> GetExpenseByCategory(int CategoryId)
        {
            return db.Expenses
                .Where(expense => expense.CategoryId == CategoryId)
                .Select(expense => new ExpenseResponse
                    {
                        Id = expense.CategoryId,
                        UserId = expense.UserId,
                        Name = expense.Name,
                        Date = expense.Date,
                        CategoryId = CategoryId,
                        Amount  = expense.Amount,
                    })
                .ToList();
        }

        public void CreateExpense(ExpenseRequest newExpense)
        {
            try
            {
                db.Expenses.Add(new Expense
                {
                    UserId = newExpense.UserId,
                    Name = newExpense.Name,
                    Date = newExpense.Date,
                    CategoryId = newExpense.CategoryId,
                    Amount = newExpense.Amount,
                });
                db.SaveChanges();
            } catch (Exception ex)
            {
                _logger.LogError(ex.Message);
            }
        }

        public void UpdateExpense(ExpenseRequest existingExpense)
        {
            var expense = db.Expenses.Find(existingExpense.Id);
            try
            {
                expense.Name = existingExpense.Name;
                expense.Date = existingExpense.Date;
                expense.Amount = existingExpense.Amount;

                db.Expenses.Update(expense);
                db.SaveChanges();
            } catch (Exception ex)
            {
                _logger.LogError(ex.Message);
            }
        }

        public void DeleteExpense(int expenseId)
        {
            db.Expenses.Remove(db.Expenses.Find(expenseId)); 
            db.SaveChanges();
        }

        public void DeleteExpenseForCategory(int categoryId)
        { 
            db.Expenses
                .RemoveRange(db.Expenses
                .Where(expense => expense.CategoryId == categoryId));
            db.SaveChanges();
        }
    }
}
