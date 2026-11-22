using System;
using System.Collections.Generic;
using CityBite.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Area> Areas { get; set; }

    public virtual DbSet<Bill> Bills { get; set; }

    public virtual DbSet<BillItem> BillItems { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<CodeUse> CodeUses { get; set; }

    public virtual DbSet<Cuisine> Cuisines { get; set; }

    public virtual DbSet<Dish> Dishes { get; set; }

    public virtual DbSet<DishSize> DishSizes { get; set; }

    public virtual DbSet<FavoriteDish> FavoriteDishes { get; set; }

    public virtual DbSet<FavoriteRestaurant> FavoriteRestaurants { get; set; }

    public virtual DbSet<FoodType> FoodTypes { get; set; }

    public virtual DbSet<OpeningHour> OpeningHours { get; set; }

    public virtual DbSet<OtpVerification> OtpVerifications { get; set; }

    public virtual DbSet<Promotion> Promotions { get; set; }

    public virtual DbSet<PromotionPackage> PromotionPackages { get; set; }

    public virtual DbSet<Restaurant> Restaurants { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<ReviewPhoto> ReviewPhotos { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Area>(entity =>
        {
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Bill>(entity =>
        {
            entity.HasIndex(e => new { e.RestaurantId, e.BillNo }, "UQ_Bills_RestaurantId_BillNo").IsUnique();

            entity.HasIndex(e => e.ReviewCode, "UQ_Bills_ReviewCode").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_Bills_CreatedAt");
            entity.Property(e => e.MaxReviewers).HasDefaultValue((byte)4, "DF_Bills_MaxReviewers");
            entity.Property(e => e.ReviewCode)
                .HasMaxLength(6)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.Total).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.Restaurant).WithMany(p => p.Bills)
                .HasForeignKey(d => d.RestaurantId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<BillItem>(entity =>
        {
            entity.Property(e => e.LineTotal).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.Bill).WithMany(p => p.BillItems)
                .HasForeignKey(d => d.BillId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Dish).WithMany(p => p.BillItems)
                .HasForeignKey(d => d.DishId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Size).WithMany(p => p.BillItems).HasForeignKey(d => d.SizeId);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(60);

            entity.HasOne(d => d.Restaurant).WithMany(p => p.Categories)
                .HasForeignKey(d => d.RestaurantId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<CodeUse>(entity =>
        {
            entity.HasKey(e => new { e.BillId, e.UserId });

            entity.Property(e => e.RedeemedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_CodeUses_RedeemedAt");

            entity.HasOne(d => d.Bill).WithMany(p => p.CodeUses)
                .HasForeignKey(d => d.BillId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.User).WithMany(p => p.CodeUses)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Cuisine>(entity =>
        {
            entity.HasIndex(e => e.Name, "UQ_Cuisines_Name").IsUnique();

            entity.Property(e => e.Icon)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Name).HasMaxLength(60);
        });

        modelBuilder.Entity<Dish>(entity =>
        {
            entity.Property(e => e.AvgRating).HasColumnType("decimal(3, 2)");
            entity.Property(e => e.BasePrice).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsAvailable).HasDefaultValue(true, "DF_Dishes_IsAvailable");
            entity.Property(e => e.Name).HasMaxLength(120);
            entity.Property(e => e.PhotoUrl)
                .HasMaxLength(500)
                .IsUnicode(false);

            entity.HasOne(d => d.Category).WithMany(p => p.Dishes).HasForeignKey(d => d.CategoryId);

            entity.HasOne(d => d.FoodType).WithMany(p => p.Dishes).HasForeignKey(d => d.FoodTypeId);

            entity.HasOne(d => d.Restaurant).WithMany(p => p.Dishes)
                .HasForeignKey(d => d.RestaurantId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<DishSize>(entity =>
        {
            entity.HasKey(e => e.SizeId);

            entity.Property(e => e.Label).HasMaxLength(40);
            entity.Property(e => e.Price).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.Dish).WithMany(p => p.DishSizes)
                .HasForeignKey(d => d.DishId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<FavoriteDish>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.DishId });

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_FavoriteDishes_CreatedAt");

            entity.HasOne(d => d.Dish).WithMany(p => p.FavoriteDishes)
                .HasForeignKey(d => d.DishId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.User).WithMany(p => p.FavoriteDishes)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<FavoriteRestaurant>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RestaurantId });

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_FavoriteRestaurants_CreatedAt");

            entity.HasOne(d => d.Restaurant).WithMany(p => p.FavoriteRestaurants)
                .HasForeignKey(d => d.RestaurantId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.User).WithMany(p => p.FavoriteRestaurants)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<FoodType>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(80);

            entity.HasOne(d => d.Cuisine).WithMany(p => p.FoodTypes)
                .HasForeignKey(d => d.CuisineId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<OpeningHour>(entity =>
        {
            entity.HasKey(e => e.HoursId);

            entity.HasIndex(e => new { e.RestaurantId, e.DayOfWeek }, "UQ_OpeningHours_RestaurantId_DayOfWeek").IsUnique();

            entity.Property(e => e.CloseTime).HasPrecision(0);
            entity.Property(e => e.OpenTime).HasPrecision(0);

            entity.HasOne(d => d.Restaurant).WithMany(p => p.OpeningHours)
                .HasForeignKey(d => d.RestaurantId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<OtpVerification>(entity =>
        {
            entity.HasKey(e => e.OtpId);

            entity.Property(e => e.CodeHash)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Purpose)
                .HasMaxLength(10)
                .IsUnicode(false);

            entity.HasOne(d => d.User).WithMany(p => p.OtpVerifications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.Property(e => e.AmountPaid).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Status)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("active", "DF_Promotions_Status");

            entity.HasOne(d => d.Package).WithMany(p => p.Promotions)
                .HasForeignKey(d => d.PackageId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Restaurant).WithMany(p => p.Promotions)
                .HasForeignKey(d => d.RestaurantId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<PromotionPackage>(entity =>
        {
            entity.HasKey(e => e.PackageId);

            entity.Property(e => e.Name).HasMaxLength(60);
            entity.Property(e => e.Placement)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.Price).HasColumnType("decimal(10, 2)");
        });

        modelBuilder.Entity<Restaurant>(entity =>
        {
            entity.HasIndex(e => e.OwnerId, "UQ_Restaurants_OwnerId").IsUnique();

            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.AvgRating).HasColumnType("decimal(3, 2)");
            entity.Property(e => e.CoverPhotoUrl)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DineIn).HasDefaultValue(true, "DF_Restaurants_DineIn");
            entity.Property(e => e.LogoUrl)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.Name).HasMaxLength(120);

            entity.HasOne(d => d.Area).WithMany(p => p.Restaurants)
                .HasForeignKey(d => d.AreaId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Owner).WithOne(p => p.Restaurant)
                .HasForeignKey<Restaurant>(d => d.OwnerId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasMany(d => d.Cuisines).WithMany(p => p.Restaurants)
                .UsingEntity<Dictionary<string, object>>(
                    "RestaurantCuisine",
                    r => r.HasOne<Cuisine>().WithMany()
                        .HasForeignKey("CuisineId")
                        .OnDelete(DeleteBehavior.ClientSetNull),
                    l => l.HasOne<Restaurant>().WithMany()
                        .HasForeignKey("RestaurantId")
                        .OnDelete(DeleteBehavior.ClientSetNull),
                    j =>
                    {
                        j.HasKey("RestaurantId", "CuisineId");
                        j.ToTable("RestaurantCuisines");
                    });
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.BillItemId }, "UQ_Reviews_UserId_BillItemId").IsUnique();

            entity.Property(e => e.Comment).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_Reviews_CreatedAt");

            entity.HasOne(d => d.BillItem).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.BillItemId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Dish).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.DishId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.User).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<ReviewPhoto>(entity =>
        {
            entity.HasKey(e => e.PhotoId);

            entity.Property(e => e.PhotoUrl)
                .HasMaxLength(500)
                .IsUnicode(false);

            entity.HasOne(d => d.Review).WithMany(p => p.ReviewPhotos)
                .HasForeignKey(d => d.ReviewId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email, "UX_Users_Email")
                .IsUnique()
                .HasFilter("([Email] IS NOT NULL)");

            entity.HasIndex(e => e.Mobile, "UX_Users_Mobile")
                .IsUnique()
                .HasFilter("([Mobile] IS NOT NULL)");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_Users_CreatedAt");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FullName).HasMaxLength(120);
            entity.Property(e => e.Mobile)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Role)
                .HasMaxLength(20)
                .IsUnicode(false);

            entity.HasOne(d => d.Area).WithMany(p => p.Users).HasForeignKey(d => d.AreaId);

            entity.HasMany(d => d.FoodTypes).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "UserFavoriteType",
                    r => r.HasOne<FoodType>().WithMany()
                        .HasForeignKey("FoodTypeId")
                        .OnDelete(DeleteBehavior.ClientSetNull),
                    l => l.HasOne<User>().WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.ClientSetNull),
                    j =>
                    {
                        j.HasKey("UserId", "FoodTypeId");
                        j.ToTable("UserFavoriteTypes");
                    });
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
