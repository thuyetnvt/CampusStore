using CampusStore.Domain.Entities;
using CampusStore.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MySql.EntityFrameworkCore.Extensions;

namespace CampusStore.Infrastructure.Persistence;

public sealed class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<long>, long>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Address> Addresses => Set<Address>();

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Product> Products => Set<Product>();

    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();

    public DbSet<ProductImage> ProductImages => Set<ProductImage>();

    public DbSet<Cart> Carts => Set<Cart>();

    public DbSet<CartItem> CartItems => Set<CartItem>();

    public DbSet<Coupon> Coupons => Set<Coupon>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    public DbSet<Payment> Payments => Set<Payment>();

    public DbSet<Review> Reviews => Set<Review>();

    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        MySQLModelBuilderExtensions.HasCharSet(builder, "utf8mb4");
        MySQLModelBuilderExtensions.UseCollation(builder, "utf8mb4_0900_ai_ci");

        ConfigureIdentity(builder);
        ConfigureCatalog(builder);
        ConfigureCart(builder);
        ConfigureCoupons(builder);
        ConfigureOrders(builder);
        ConfigureReviews(builder);
        ConfigureAudit(builder);
    }

    private static void ConfigureIdentity(ModelBuilder builder)
    {
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("Users");
            entity.Property(x => x.FullName).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        });

        builder.Entity<IdentityRole<long>>(entity =>
        {
            entity.ToTable("Roles");
        });

        builder.Entity<IdentityUserRole<long>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<long>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<long>>().ToTable("UserLogins");
        builder.Entity<IdentityRoleClaim<long>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserToken<long>>().ToTable("UserTokens");

        builder.Entity<Address>(entity =>
        {
            entity.ToTable("Addresses");
            entity.Property(x => x.ReceiverName).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(32).IsRequired();
            entity.Property(x => x.Province).HasMaxLength(120).IsRequired();
            entity.Property(x => x.District).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Ward).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Detail).HasMaxLength(500).IsRequired();
            entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.UserId);
            entity.HasIndex(x => x.UserId);
        });
    }

    private static void ConfigureCatalog(ModelBuilder builder)
    {
        builder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000);
            entity.HasIndex(x => x.Slug).IsUnique();
            entity.HasOne<Category>().WithMany().HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Product>(entity =>
        {
            entity.ToTable("Products");
            entity.Property(x => x.Name).HasMaxLength(220).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(240).IsRequired();
            entity.Property(x => x.Description).HasColumnType("text").IsRequired();
            entity.Property(x => x.BasePrice).HasPrecision(18, 2);
            entity.Property(x => x.SalePrice).HasPrecision(18, 2);
            entity.HasIndex(x => x.Slug).IsUnique();
            entity.HasIndex(x => x.Name);
            entity.HasOne<Category>().WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ProductVariant>(entity =>
        {
            entity.ToTable("ProductVariants");
            entity.Property(x => x.Sku).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Color).HasMaxLength(80);
            entity.Property(x => x.Size).HasMaxLength(80);
            entity.Property(x => x.Price).HasPrecision(18, 2);
            entity.HasIndex(x => x.Sku).IsUnique();
            entity.HasOne<Product>().WithMany().HasForeignKey(x => x.ProductId);
        });

        builder.Entity<ProductImage>(entity =>
        {
            entity.ToTable("ProductImages");
            entity.Property(x => x.ImageUrl).HasMaxLength(600).IsRequired();
            entity.Property(x => x.AltText).HasMaxLength(220).IsRequired();
            entity.HasOne<Product>().WithMany().HasForeignKey(x => x.ProductId);
            entity.HasIndex(x => new { x.ProductId, x.SortOrder });
        });
    }

    private static void ConfigureCart(ModelBuilder builder)
    {
        builder.Entity<Cart>(entity =>
        {
            entity.ToTable("Carts");
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.UserId);
        });

        builder.Entity<CartItem>(entity =>
        {
            entity.ToTable("CartItems");
            entity.HasIndex(x => new { x.CartId, x.ProductVariantId }).IsUnique();
            entity.HasOne<Cart>().WithMany().HasForeignKey(x => x.CartId);
            entity.HasOne<ProductVariant>().WithMany().HasForeignKey(x => x.ProductVariantId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureCoupons(ModelBuilder builder)
    {
        builder.Entity<Coupon>(entity =>
        {
            entity.ToTable("Coupons");
            entity.Property(x => x.Code).HasMaxLength(80).IsRequired();
            entity.Property(x => x.DiscountType).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.DiscountValue).HasPrecision(18, 2);
            entity.Property(x => x.MinimumOrderAmount).HasPrecision(18, 2);
            entity.Property(x => x.MaximumDiscountAmount).HasPrecision(18, 2);
            entity.HasIndex(x => x.Code).IsUnique();
        });
    }

    private static void ConfigureOrders(ModelBuilder builder)
    {
        builder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");
            entity.Property(x => x.OrderCode).HasMaxLength(40).IsRequired();
            entity.Property(x => x.ReceiverName).HasMaxLength(160).IsRequired();
            entity.Property(x => x.ReceiverPhone).HasMaxLength(32).IsRequired();
            entity.Property(x => x.ShippingAddress).HasMaxLength(700).IsRequired();
            entity.Property(x => x.Subtotal).HasPrecision(18, 2);
            entity.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            entity.Property(x => x.ShippingFee).HasPrecision(18, 2);
            entity.Property(x => x.TotalAmount).HasPrecision(18, 2);
            entity.Property(x => x.PaymentMethod).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.PaymentStatus).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.OrderStatus).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.Note).HasMaxLength(1000);
            entity.Property(x => x.CancellationReason).HasMaxLength(1000);
            entity.HasIndex(x => x.OrderCode).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.CreatedAt });
            entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems");
            entity.Property(x => x.ProductName).HasMaxLength(220).IsRequired();
            entity.Property(x => x.Sku).HasMaxLength(80).IsRequired();
            entity.Property(x => x.VariantDescription).HasMaxLength(220).IsRequired();
            entity.Property(x => x.UnitPrice).HasPrecision(18, 2);
            entity.Property(x => x.LineTotal).HasPrecision(18, 2);
            entity.HasOne<Order>().WithMany().HasForeignKey(x => x.OrderId);
            entity.HasOne<ProductVariant>().WithMany().HasForeignKey(x => x.ProductVariantId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Payment>(entity =>
        {
            entity.ToTable("Payments");
            entity.Property(x => x.Method).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.TransactionCode).HasMaxLength(120);
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.HasOne<Order>().WithMany().HasForeignKey(x => x.OrderId);
        });

        builder.Entity<OrderStatusHistory>(entity =>
        {
            entity.ToTable("OrderStatusHistories");
            entity.Property(x => x.OldStatus).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.NewStatus).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.Note).HasMaxLength(1000);
            entity.HasOne<Order>().WithMany().HasForeignKey(x => x.OrderId);
            entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.ChangedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureReviews(ModelBuilder builder)
    {
        builder.Entity<Review>(entity =>
        {
            entity.ToTable("Reviews");
            entity.Property(x => x.Comment).HasMaxLength(1000);
            entity.HasIndex(x => x.OrderItemId).IsUnique();
            entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<OrderItem>().WithMany().HasForeignKey(x => x.OrderItemId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Product>().WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureAudit(ModelBuilder builder)
    {
        builder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs");
            entity.Property(x => x.Action).HasMaxLength(120).IsRequired();
            entity.Property(x => x.EntityType).HasMaxLength(120).IsRequired();
            entity.Property(x => x.OldValues).HasColumnType("json");
            entity.Property(x => x.NewValues).HasColumnType("json");
            entity.Property(x => x.IpAddress).HasMaxLength(64);
            entity.HasIndex(x => new { x.EntityType, x.EntityId });
            entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
