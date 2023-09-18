using Breeze.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Breeze.Data
{
    internal class IncomeConfiguration : IEntityTypeConfiguration<Income>
    {
        public void Configure(EntityTypeBuilder<Income> modelBuilder)
        {
            modelBuilder.ToTable("Income");
            modelBuilder
                .HasOne(income => income.Budget)
                .WithMany(budget => budget.Income)
                .HasForeignKey("BudgetId");
        }
    }
}
