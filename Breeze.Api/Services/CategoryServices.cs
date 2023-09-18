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
                .Where(category => category.BudgetId == budgetId)
                .Select(category => new CategoryResponse
                {
                    Id = category.Id,
                    UserId = category.UserId,
                    Name = category.Name,
                    Date = DateTime.Now,
                    Budget = category.Budget,
                    CurrentSpend = category.CurrentSpend,
                    BudgetId = category.BudgetId,
                })
                .First();
        }

        public int CreateCategory(CategoryRequest newCategory)
        {
            try
            {
                Category category = new Category
                {
                    UserId = newCategory.UserId,
                    Name = newCategory.Name,
                    Date = DateTime.Now,
                    Budget = newCategory.Budget,
                    CurrentSpend = newCategory.CurrentSpend,
                    BudgetId = newCategory.BudgetId,
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
            try
            {
                category.Name = updatedCategory.Name;
                category.Budget = updatedCategory.Budget;
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

        public int DeleteCategory(int categoryId)
        {
            db.Categories.Remove(db.Categories.Find(categoryId));
            db.SaveChanges();
            return categoryId;
        }

        public int DeleteCategoriesForBudget(int budgetId)
        {
            db.Categories
                .RemoveRange(db.Categories
                .Where(category => category.BudgetId == budgetId));
            db.SaveChanges();
            return budgetId;
        }
    }
}
