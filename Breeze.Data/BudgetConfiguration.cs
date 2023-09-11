using Microsoft.EntityFrameworkCore;
using Breeze.Domain;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Breeze.Data
{
    internal class BudgetConfiguration : IEntityTypeConfiguration<Budget>
    {
        public void Configure(EntityTypeBuilder<Budget> modelBuilder)
        {
            modelBuilder.ToTable("Budget");
            modelBuilder
                .HasOne(budget => budget.User)
                .WithMany(user => user.Budgets)
                .HasForeignKey("UserId");
        }
    }
}