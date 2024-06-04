using Breeze.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> modelBuilder)
    {
        modelBuilder.ToTable("Category");
        modelBuilder
            .Property(c => c.CurrentSpend)
            .HasColumnType("decimal(18, 2)");
        modelBuilder
            .Property(c => c.CurrentSpend)
            .HasPrecision(18, 2);
        modelBuilder
            .Property(c => c.Allocation)
            .HasColumnType("decimal(18, 2)");
        modelBuilder
            .Property(c => c.Allocation)
            .HasPrecision(18, 2);
    }
}
