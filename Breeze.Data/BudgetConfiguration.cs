using Breeze.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Breeze.Data
{
    internal class BudgetConfiguration : IEntityTypeConfiguration<Budget>
    {
        public void Configure(EntityTypeBuilder<Budget> modelBuilder)
        {
            modelBuilder.ToTable("Budget");
            modelBuilder
                .HasMany(budget => budget.Categories)
                .WithOne(category => category.Budget)
                .HasForeignKey("BudgetId");
            modelBuilder
                .HasMany(budget => budget.Income)
                .WithOne(income => income.Budget)
                .HasForeignKey("BudgetId");
            modelBuilder
                .Property(b => b.MonthlyExpenses)
                .HasColumnType("decimal(18, 2)");
            modelBuilder
                .Property(b => b.MonthlyExpenses)
                .HasPrecision(18, 2);
            modelBuilder
                .Property(b => b.MonthlyIncome)
                .HasColumnType("decimal(18, 2)");
            modelBuilder
                .Property(b => b.MonthlyIncome)
                .HasPrecision(18, 2);

        }
    }
}