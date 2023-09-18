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

        public List<ExpenseResponse> GetExpenseByCategoryId(int CategoryId)
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

        public int CreateExpense(ExpenseRequest newExpense)
        {
            try
            {
                Expense expense = new Expense
                {
                    UserId = newExpense.UserId,
                    Name = newExpense.Name,
                    Date = newExpense.Date,
                    CategoryId = newExpense.CategoryId,
                    Amount = newExpense.Amount,
                };

                db.Expenses.Add(expense);
                db.SaveChanges();
                return expense.Id;
            } catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -1;
            }
        }

        public int UpdateExpense(ExpenseRequest existingExpense)
        {
            var expense = db.Expenses.Find(existingExpense.Id);
            try
            {
                expense.Name = existingExpense.Name;
                expense.Date = existingExpense.Date;
                expense.Amount = existingExpense.Amount;

                db.Expenses.Update(expense);
                db.SaveChanges();
                return expense.Id;
            } catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -1;
            }
        }

        public int DeleteExpense(int expenseId)
        {
            db.Expenses.Remove(db.Expenses.Find(expenseId)); 
            db.SaveChanges();
            return expenseId;
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
