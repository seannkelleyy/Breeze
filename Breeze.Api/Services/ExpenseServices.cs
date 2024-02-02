using Breeze.Api.RequestResponseObjects.Expenses;
using Breeze.Data;
using Breeze.Domain;

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
                .Where(expense => expense.Category.Id == CategoryId)
                .Select(expense => new ExpenseResponse
                {
                    Id = expense.Category.Id,
                    UserEmail = expense.User.UserEmail,
                    Name = expense.Name,
                    Date = expense.Date,
                    CategoryId = CategoryId,
                    Amount = expense.Amount,
                })
                .ToList();
        }

        public int CreateExpense(ExpenseRequest newExpense)
        {
            try
            {
                var category = db.Categories.Find(newExpense.CategoryId);
                var user = db.Users.Find(newExpense.UserEmail);
                if (category == null || user == null)
                {
                    return -1;
                }
                Expense expense = new Expense
                {
                    User = user,
                    Name = newExpense.Name,
                    Date = newExpense.Date,
                    Category = category,
                    Amount = newExpense.Amount,
                };

                db.Expenses.Add(expense);
                db.SaveChanges();
                return expense.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -1;
            }
        }

        public int UpdateExpense(ExpenseRequest existingExpense)
        {
            var expense = db.Expenses.Find(existingExpense.Id);
            if (expense == null)
            {
                return -1;
            }
            try
            {
                expense.Name = existingExpense.Name;
                expense.Date = existingExpense.Date;
                expense.Amount = existingExpense.Amount;

                db.Expenses.Update(expense);
                db.SaveChanges();
                return expense.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -1;
            }
        }

        public int DeleteExpense(int expenseId)
        {
            var expense = db.Expenses.Find(expenseId);
            if (expense == null)
            {
                return -1;
            }
            db.Expenses.Remove(expense);
            db.SaveChanges();
            return expenseId;
        }

        public void DeleteExpenseForCategory(int categoryId)
        {
            db.Expenses
                .RemoveRange(db.Expenses
                .Where(expense => expense.Category.Id == categoryId));
            db.SaveChanges();
        }
    }
}
