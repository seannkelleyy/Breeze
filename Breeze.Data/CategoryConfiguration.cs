using Breeze.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Breeze.Data
{
    internal class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> modelBuilder)
        {
            modelBuilder.ToTable("Category");
            modelBuilder
                .HasOne(income => income.User)
                .WithMany(user => user.Categories)
                .HasForeignKey("UserEmail");
        }
    }
}
