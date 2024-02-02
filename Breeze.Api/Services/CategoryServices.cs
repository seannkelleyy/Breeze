using Breeze.Api.RequestResponseObjects.Categories;
using Breeze.Data;
using Breeze.Domain;

namespace Breeze.Api.Services
{
    public class CategoryService
    {
        private IConfiguration _config;
        private readonly ILogger _logger;
        private readonly BreezeContext db;

        public CategoryService(IConfiguration config, BreezeContext dbContext, ILogger logger)
        {
            _config = config;
            _logger = logger;
            db = dbContext;
        }

        public CategoryResponse GetCategoryByBudgetId(int budgetId)
        {
            return db.Categories
                .Where(category => category.Budget.Id == budgetId)
                .Select(category => new CategoryResponse
                {
                    Id = category.Id,
                    UserEmail = category.User.UserEmail,
                    Name = category.Name,
                    Date = DateTime.Now,
                    Allocation = category.Allocation,
                    Spent = category.Spent,
                    BudgetId = category.Budget.Id,
                })
                .First();
        }

        public int CreateCategory(CategoryRequest newCategory)
        {
            try
            {
                var user = db.Users.Where(user => user.UserEmail == newCategory.UserEmail).FirstOrDefault();
                var budget = db.Budgets.Where(budget => budget.Id == newCategory.BudgetId).FirstOrDefault();
                if (user == null || budget == null)
                {
                    return -1;
                }
                Category category = new Category
                {
                    User = user,
                    Name = newCategory.Name,
                    Date = DateTime.Now,
                    Allocation = newCategory.Allcoation,
                    Spent = newCategory.Spent,
                    Budget = budget,
                };

                db.Categories.Add(category);
                db.SaveChanges();
                return category.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -1;
            }
        }

        public int UpdateCategory(CategoryRequest updatedCategory)
        {
            var category = db.Categories.Find(updatedCategory.Id);
            if (category == null)
            {
                return -1;
            }
            try
            {
                category.Name = updatedCategory.Name;
                category.Allocation = updatedCategory.Allcoation;
                category.Spent = updatedCategory.Spent;
                db.Categories.Update(category);
                db.SaveChanges();
                return category.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return -1;
            }
        }

        public int DeleteCategory(int categoryId)
        {
            var category = db.Categories.Find(categoryId);
            if (category == null)
            {
                return -1;
            }
            db.Categories.Remove(category);
            db.SaveChanges();
            return categoryId;
        }

        public int DeleteCategoriesForBudget(int budgetId)
        {
            db.Categories
                .RemoveRange(db.Categories
                .Where(category => category.Budget.Id == budgetId));
            db.SaveChanges();
            return budgetId;
        }
    }
}
