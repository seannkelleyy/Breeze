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
                .Property(e => e.Amount)
                .HasColumnType("decimal(18, 2)");
            modelBuilder
                .Property(e => e.Amount)
                .HasPrecision(18, 2);
        }
    }
}

