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

        public ExpenseResponse GetExpenseById(string userId, int expenseId)
        {
            return db.Expenses
                .Where(expense => expense.Id == expenseId && expense.User.Id.Equals(userId))
                .Select(expense => new ExpenseResponse
                {
                    Id = expense.Id,
                    UserId = expense.User.UserId,
                    Name = expense.Name,
                    Date = expense.Date,
                    CategoryId = expense.Category.Id,
                    Amount = expense.Amount,
                }).First();
        }

        public List<ExpenseResponse> GetExpenseByCategoryId(string userId, int CategoryId)
        {
            return db.Expenses
                .Where(expense => expense.Category.Id == CategoryId && expense.User.Id.Equals(userId))
                .Select(expense => new ExpenseResponse
                {
                    Id = expense.Category.Id,
                    UserId = expense.User.UserId,
                    Name = expense.Name,
                    Date = expense.Date,
                    CategoryId = CategoryId,
                    Amount = expense.Amount,
                })
                .ToList();
        }

        public int CreateExpense(string userId, ExpenseRequest newExpense)
        {
            try
            {
                var category = db.Categories.Find(newExpense.CategoryId);
                var user = db.Users.Find(userId);
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

        public int UpdateExpense(string userId, ExpenseRequest existingExpense)
        {
            var expense = db.Expenses.Find(existingExpense.Id);

            if (expense == null)
            {
                return -1;
            }
            if (!expense.User.Id.Equals(userId))
            {
                return -2;
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

        public int DeleteExpense(string userId, int expenseId)
        {
            var expense = db.Expenses.Find(expenseId);
            if (expense == null)
            {
                return -1;
            }
            if (!expense.User.Id.Equals(userId))
            {
                return -2;
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
