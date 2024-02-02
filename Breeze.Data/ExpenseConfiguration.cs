using Breeze.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Breeze.Data
{
    internal class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
    {
        public void Configure(EntityTypeBuilder<Expense> modelBuilder)
        {
            modelBuilder.ToTable("Expense");
            modelBuilder
                .HasOne(expense => expense.Category)
                .WithMany(category => category.Expenses)
                .HasForeignKey("CategoryId");
            modelBuilder
                .HasOne(expense => expense.User)
                .WithMany(user => user.Expenses)
                .HasForeignKey("UserEmail");
        }
    }
}

