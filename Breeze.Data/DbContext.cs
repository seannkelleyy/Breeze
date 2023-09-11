using Breeze.Domain;
using Microsoft.EntityFrameworkCore;

namespace Breeze.Data
{
    public class BreezeContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Category> Categories { get; set; }

        public BreezeContext(DbContextOptions<BreezeContext> options) : base
            (options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasDefaultSchema("dbo");
            modelBuilder.Entity<Category>().ToTable("Category");
            modelBuilder.Entity<User>().ToTable("User");
            modelBuilder.ApplyConfiguration(new ExpenseConfiguration());

        }
    }
}
