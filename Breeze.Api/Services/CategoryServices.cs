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



        public CategoryResponse GetCategory(string userEmail, int categoryId)
        {
            return db.Categories
                .Where(category => category.Id == categoryId && category.UserEmail.Equals(userEmail))
                .Select(category => new CategoryResponse
                {
                    Id = category.Id,
                    UserEmail = category.UserEmail,
                    Name = category.Name,
                    Allocation = category.Allocation,
                    CurrentSpend = category.CurrentSpend,
                    BudgetId = category.Budget.Id,
                })
                .First();
        }

        public List<CategoryResponse> GetCategories(string userEmail, int budgetId)
        {
            return db.Categories
                .Where(category => category.Budget.Id == budgetId && category.UserEmail.Equals(userEmail))
                .Select(category => new CategoryResponse
                {
                    Id = category.Id,
                    UserEmail = category.UserEmail,
                    Name = category.Name,
                    Allocation = category.Allocation,
                    CurrentSpend = category.CurrentSpend,
                    BudgetId = category.Budget.Id,
                })
                .ToList();
        }
        public int CreateCategory(string userEmail, CategoryRequest newCategory)
        {
            try
            {
                var budget = db.Budgets.Where(budget => budget.Id == newCategory.BudgetId).FirstOrDefault();
                if (budget == null)
                {
                    return -1;
                }
                Category category = new Category
                {
                    UserEmail = userEmail,
                    Name = newCategory.Name,
                    Allocation = newCategory.Allcoation,
                    CurrentSpend = newCategory.CurrentSpend,
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

        public int UpdateCategory(string userEmail, CategoryRequest updatedCategory)
        {
            var category = db.Categories.Find(updatedCategory.Id);
            if (category == null || category.UserEmail.Equals(userEmail))
            {
                return -1;
            }
            try
            {
                category.Name = updatedCategory.Name;
                category.Allocation = updatedCategory.Allcoation;
                category.CurrentSpend = updatedCategory.CurrentSpend;
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

        public int DeleteCategory(string userEmail, int categoryId)
        {
            var category = db.Categories.Find(categoryId);
            if (category == null)
            {
                return -1;
            }
            if (!category.UserEmail.Equals(userEmail))
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
