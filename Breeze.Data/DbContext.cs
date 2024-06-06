using Breeze.Domain;
using Microsoft.EntityFrameworkCore;

namespace Breeze.Data
{
    public class BreezeContext : DbContext
    {
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Income> Incomes { get; set; }
        public DbSet<@int> Categories { get; set; }
        public DbSet<Budget> Budgets { get; set; }

        public BreezeContext(DbContextOptions<BreezeContext> options) : base
            (options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasDefaultSchema("dbo");
            modelBuilder.ApplyConfiguration(new BudgetConfiguration());
            modelBuilder.ApplyConfiguration(new CategoryConfiguration());
            modelBuilder.ApplyConfiguration(new ExpenseConfiguration());
            modelBuilder.ApplyConfiguration(new IncomeConfiguration());

        }
    }
}
