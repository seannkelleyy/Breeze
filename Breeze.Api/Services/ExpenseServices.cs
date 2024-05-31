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

        public ExpenseResponse GetExpenseById(string userEmail, int expenseId)
        {
            return db.Expenses
                .Where(expense => expense.Id == expenseId && expense.UserEmail.Equals(userEmail))
                .Select(expense => new ExpenseResponse
                {
                    Id = expense.Id,
                    UserEmail = expense.UserEmail,
                    Name = expense.Name,
                    Year = expense.Year,
                    Month = expense.Month,
                    Day = expense.Day,
                    CategoryId = expense.Category.Id,
                    Amount = expense.Amount,
                }).First();
        }

        public List<ExpenseResponse> GetExpenseByCategoryId(string userEmail, int CategoryId)
        {
            return db.Expenses
                .Where(expense => expense.Category.Id == CategoryId && expense.UserEmail.Equals(userEmail))
                .Select(expense => new ExpenseResponse
                {
                    Id = expense.Category.Id,
                    UserEmail = expense.UserEmail,
                    Name = expense.Name,
                    Year = expense.Year,
                    Month = expense.Month,
                    Day = expense.Day,
                    CategoryId = CategoryId,
                    Amount = expense.Amount,
                })
                .ToList();
        }

        public int CreateExpense(string userEmail, ExpenseRequest newExpense)
        {
            try
            {
                var category = db.Categories.Find(newExpense.CategoryId);
                if (category == null)
                {
                    return -1;
                }
                Expense expense = new Expense
                {
                    UserEmail = userEmail,
                    Name = newExpense.Name,
                    Year = newExpense.Year,
                    Month = newExpense.Month,
                    Day = newExpense.Day,
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

        public int UpdateExpense(string userEmail, ExpenseRequest updatedExpense)
        {
            var expense = db.Expenses.Find(updatedExpense.Id);

            if (expense == null)
            {
                return -1;
            }
            if (!expense.UserEmail.Equals(userEmail))
            {
                return -2;
            }
            try
            {
                expense.Name = updatedExpense.Name;
                expense.Year = updatedExpense.Year;
                expense.Month = updatedExpense.Month;
                expense.Day = updatedExpense.Day;
                expense.Amount = updatedExpense.Amount;

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

        public int DeleteExpense(string userEmail, int expenseId)
        {
            var expense = db.Expenses.Find(expenseId);
            if (expense == null)
            {
                return -1;
            }
            if (!expense.UserEmail.Equals(userEmail))
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
