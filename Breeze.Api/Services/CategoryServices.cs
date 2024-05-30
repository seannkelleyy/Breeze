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



        public CategoryResponse GetCategory(string userId, int categoryId)
        {
            return db.Categories
                .Where(category => category.Id == categoryId && category.User.UserId.Equals(userId))
                .Select(category => new CategoryResponse
                {
                    Id = category.Id,
                    UserId = category.User.UserId,
                    Name = category.Name,
                    Date = DateTime.Now,
                    Allocation = category.Allocation,
                    Spent = category.Spent,
                    BudgetId = category.Budget.Id,
                })
                .First();
        }

        public List<CategoryResponse> GetCategories(string userId, int budgetId)
        {
            return db.Categories
                .Where(category => category.Budget.Id == budgetId && category.User.UserId.Equals(userId))
                .Select(category => new CategoryResponse
                {
                    Id = category.Id,
                    UserId = category.User.UserId,
                    Name = category.Name,
                    Date = DateTime.Now,
                    Allocation = category.Allocation,
                    Spent = category.Spent,
                    BudgetId = category.Budget.Id,
                })
                .ToList();
        }
        public int CreateCategory(string userId, CategoryRequest newCategory)
        {
            try
            {
                var user = db.Users.Where(user => user.UserId.Equals(userId)).FirstOrDefault();
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

        public int UpdateCategory(string userId, CategoryRequest updatedCategory)
        {
            var category = db.Categories.Find(updatedCategory.Id);
            if (category == null || category.User.UserId.Equals(userId))
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

        public int DeleteCategory(string userId, int categoryId)
        {
            var category = db.Categories.Find(categoryId);
            if (category == null)
            {
                return -1;
            }
            if (!category.User.UserId.Equals(userId))
            {
                return -2;
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
