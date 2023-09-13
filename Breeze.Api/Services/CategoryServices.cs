using Breeze.Api.RequestResponseObjects.Categories;
using Breeze.Data;
using Breeze.Domain;
using Microsoft.EntityFrameworkCore;

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

        public CategoryResponse GetCategoryById(int id)
        {
            return db.Categories
                .Where(category => category.Id == id)
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

        public void CreateCategory(CategoryRequest newCategory)
        {
            try
            {
                db.Categories.Add(new Category
                {
                    UserId = newCategory.UserId,
                    Name = newCategory.Name,
                    Date = DateTime.Now,
                    Budget = newCategory.Budget,
                    CurrentSpend = newCategory.CurrentSpend,
                    BudgetId = newCategory.BudgetId,
                });
                db.SaveChanges();
            } catch (Exception ex)
            {
                _logger.LogError(ex.Message);
            }
        }
         
        public void UpdateCategory(CategoryRequest updatedCategory)
        {
            var category = db.Categories.Find(updatedCategory.Id);
            try
            {
                category.Name = updatedCategory.Name;
                category.Budget = updatedCategory.Budget;
                category.CurrentSpend = updatedCategory.CurrentSpend;
                db.Categories.Update(category);
                db.SaveChanges();
            } catch (Exception ex)
            {
                _logger.LogError(ex.Message);
            }
        }

        public void DeleteCategory(int categoryId)
        {
            db.Categories.Remove(db.Categories.Find(categoryId));
            db.SaveChanges();
        }

        public void DeleteCategoriesForBudget(int budgetId)
        {
            db.Categories
                .RemoveRange(db.Categories
                .Where(category => category.BudgetId == budgetId));
            db.SaveChanges();
        }
    }
}
