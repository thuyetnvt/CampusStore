using CampusStore.Domain.Constants;
using CampusStore.Domain.Entities;
using CampusStore.Domain.Enums;
using CampusStore.Infrastructure.Identity;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CampusStore.Infrastructure.Seeding;

public static class DevelopmentDataSeeder
{
    private static readonly string[] Roles =
    [
        RoleNames.Customer,
        RoleNames.Staff,
        RoleNames.Admin
    ];

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var scopedServices = scope.ServiceProvider;
        var roleManager = scopedServices.GetRequiredService<RoleManager<IdentityRole<long>>>();
        var userManager = scopedServices.GetRequiredService<UserManager<ApplicationUser>>();
        var configuration = scopedServices.GetRequiredService<IConfiguration>();
        var dbContext = scopedServices.GetRequiredService<AppDbContext>();

        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<long>(role));
            }
        }

        var demoPassword = configuration["Seed:DemoPassword"];
        if (string.IsNullOrWhiteSpace(demoPassword))
        {
            return;
        }

        await SeedUserAsync(
            userManager,
            email: "admin@campusstore.local",
            fullName: "CampusStore Admin",
            role: RoleNames.Admin,
            password: demoPassword);

        await SeedUserAsync(
            userManager,
            email: "staff@campusstore.local",
            fullName: "CampusStore Staff",
            role: RoleNames.Staff,
            password: demoPassword);

        await SeedUserAsync(
            userManager,
            email: "customer@campusstore.local",
            fullName: "CampusStore Customer",
            role: RoleNames.Customer,
            password: demoPassword);

        for (var i = 1; i <= 5; i++)
        {
            await SeedUserAsync(
                userManager,
                email: $"customer{i}@campusstore.local",
                fullName: $"CampusStore Customer {i}",
                role: RoleNames.Customer,
                password: demoPassword);
        }

        await SeedCatalogAsync(dbContext, cancellationToken);
        await NormalizeCatalogTextAsync(dbContext, cancellationToken);
        await SeedCouponsAsync(dbContext, cancellationToken);
        await SeedOrdersAsync(dbContext, userManager, cancellationToken);
    }

    private static async Task SeedUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string fullName,
        string role,
        string password)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                Email = email,
                UserName = email,
                FullName = fullName,
                CreatedAt = DateTimeOffset.UtcNow,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(user, password);
            if (!createResult.Succeeded)
            {
                return;
            }
        }

        if (!await userManager.IsInRoleAsync(user, role))
        {
            await userManager.AddToRoleAsync(user, role);
        }
    }

    private static async Task SeedCatalogAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        if (await dbContext.Categories.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var categories = new[]
        {
            new Category { Name = "Văn phòng phẩm", Slug = "van-phong-pham", Description = "Dụng cụ văn phòng và học tập.", CreatedAt = now },
            new Category { Name = "Sổ và vở", Slug = "so-va-vo", Description = "Vở ghi chép, sổ tay và planner.", CreatedAt = now },
            new Category { Name = "Bút viết", Slug = "but-viet", Description = "Bút bi, bút gel, bút highlight và bút chì.", CreatedAt = now },
            new Category { Name = "Dụng cụ học tập", Slug = "dung-cu-hoc-tap", Description = "Thước kẻ, compa, kéo, băng dính.", CreatedAt = now },
            new Category { Name = "Học liệu", Slug = "hoc-lieu", Description = "Flashcard, sách tham khảo và tài liệu học tập.", CreatedAt = now },
            new Category { Name = "Balo và túi", Slug = "balo-va-tui", Description = "Balo laptop và túi đựng đồ học tập.", CreatedAt = now },
            new Category { Name = "Đèn bàn", Slug = "den-ban", Description = "Đèn học chống mỏi mắt.", CreatedAt = now },
            new Category { Name = "Phụ kiện máy tính", Slug = "phu-kien-may-tinh", Description = "Chuột, bàn phím, USB và phụ kiện học online.", CreatedAt = now }
        };

        dbContext.Categories.AddRange(categories);
        await dbContext.SaveChangesAsync(cancellationToken);

        var products = new List<Product>();
        var variants = new List<ProductVariant>();
        var images = new List<ProductImage>();
        var categoryBySlug = categories.ToDictionary(category => category.Slug);

        var productSeeds = CreateProductSeeds();
        for (var i = 0; i < productSeeds.Count; i++)
        {
            var seed = productSeeds[i];
            var product = new Product
            {
                CategoryId = categoryBySlug[seed.CategorySlug].Id,
                Name = seed.Name,
                Slug = seed.Slug,
                Description = seed.Description,
                BasePrice = seed.BasePrice,
                SalePrice = seed.SalePrice,
                IsActive = true,
                CreatedAt = now.AddMinutes(-i)
            };

            products.Add(product);
        }

        dbContext.Products.AddRange(products);
        await dbContext.SaveChangesAsync(cancellationToken);

        for (var i = 0; i < products.Count; i++)
        {
            var product = products[i];
            var seed = productSeeds[i];
            var stock = i % 13 == 0 ? 0 : i % 9 == 0 ? 3 : 20 + (i % 17);

            variants.Add(new ProductVariant
            {
                ProductId = product.Id,
                Sku = $"CS-{product.Id:0000}-STD",
                Color = seed.Color,
                Size = seed.Size,
                Price = seed.SalePrice ?? seed.BasePrice,
                StockQuantity = stock,
                LowStockThreshold = 5,
                IsActive = true
            });

            if (i % 4 == 0)
            {
                variants.Add(new ProductVariant
                {
                    ProductId = product.Id,
                    Sku = $"CS-{product.Id:0000}-PLUS",
                    Color = seed.AltColor,
                    Size = seed.Size,
                    Price = (seed.SalePrice ?? seed.BasePrice) + 10_000,
                    StockQuantity = stock == 0 ? 0 : stock + 8,
                    LowStockThreshold = 5,
                    IsActive = true
                });
            }

            images.Add(new ProductImage
            {
                ProductId = product.Id,
                ImageUrl = $"/images/products/{product.Slug}.jpg",
                AltText = product.Name,
                SortOrder = 1,
                IsPrimary = true
            });
        }

        dbContext.ProductVariants.AddRange(variants);
        dbContext.ProductImages.AddRange(images);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedCouponsAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        if (await dbContext.Coupons.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        dbContext.Coupons.AddRange(
            new Coupon
            {
                Code = "STUDENT10",
                DiscountType = DiscountType.Percentage,
                DiscountValue = 10,
                MinimumOrderAmount = 100_000,
                MaximumDiscountAmount = 50_000,
                StartAt = now.AddDays(-10),
                EndAt = now.AddDays(60),
                UsageLimit = 200,
                UsedCount = 12,
                IsActive = true
            },
            new Coupon
            {
                Code = "FREESHIP25",
                DiscountType = DiscountType.FixedAmount,
                DiscountValue = 25_000,
                MinimumOrderAmount = 150_000,
                StartAt = now.AddDays(-5),
                EndAt = now.AddDays(45),
                UsageLimit = 150,
                UsedCount = 8,
                IsActive = true
            },
            new Coupon
            {
                Code = "BACK2SCHOOL",
                DiscountType = DiscountType.Percentage,
                DiscountValue = 15,
                MinimumOrderAmount = 250_000,
                MaximumDiscountAmount = 80_000,
                StartAt = now.AddDays(-15),
                EndAt = now.AddDays(30),
                UsageLimit = 100,
                UsedCount = 21,
                IsActive = true
            },
            new Coupon
            {
                Code = "NOTEBOOK20K",
                DiscountType = DiscountType.FixedAmount,
                DiscountValue = 20_000,
                MinimumOrderAmount = 120_000,
                StartAt = now.AddDays(-3),
                EndAt = now.AddDays(25),
                UsageLimit = 120,
                UsedCount = 3,
                IsActive = true
            },
            new Coupon
            {
                Code = "EXPIRED5",
                DiscountType = DiscountType.Percentage,
                DiscountValue = 5,
                MinimumOrderAmount = 50_000,
                StartAt = now.AddDays(-30),
                EndAt = now.AddDays(-1),
                UsageLimit = 50,
                UsedCount = 50,
                IsActive = false
            });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task NormalizeCatalogTextAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var categorySeeds = new Dictionary<string, (string Name, string Description)>
        {
            ["van-phong-pham"] = ("Văn phòng phẩm", "Dụng cụ văn phòng và học tập."),
            ["so-va-vo"] = ("Sổ và vở", "Vở ghi chép, sổ tay và planner."),
            ["but-viet"] = ("Bút viết", "Bút bi, bút gel, bút highlight và bút chì."),
            ["dung-cu-hoc-tap"] = ("Dụng cụ học tập", "Thước kẻ, compa, kéo, băng dính."),
            ["hoc-lieu"] = ("Học liệu", "Flashcard, sách tham khảo và tài liệu học tập."),
            ["balo-va-tui"] = ("Balo và túi", "Balo laptop và túi đựng đồ học tập."),
            ["den-ban"] = ("Đèn bàn", "Đèn học chống mỏi mắt."),
            ["phu-kien-may-tinh"] = ("Phụ kiện máy tính", "Chuột, bàn phím, USB và phụ kiện học online.")
        };

        var categories = await dbContext.Categories.ToListAsync(cancellationToken);
        foreach (var category in categories)
        {
            if (categorySeeds.TryGetValue(category.Slug, out var seed))
            {
                category.Name = seed.Name;
                category.Description = seed.Description;
                category.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        var productSeeds = CreateProductSeeds().ToDictionary(seed => seed.Slug);
        var products = await dbContext.Products.ToListAsync(cancellationToken);
        foreach (var product in products)
        {
            if (!productSeeds.TryGetValue(product.Slug, out var seed))
            {
                continue;
            }

            product.Name = seed.Name;
            product.Description = seed.Description;
            product.UpdatedAt = DateTimeOffset.UtcNow;

            var images = await dbContext.ProductImages
                .Where(image => image.ProductId == product.Id)
                .ToListAsync(cancellationToken);
            foreach (var image in images)
            {
                image.AltText = seed.Name;
            }

            var variants = await dbContext.ProductVariants
                .Where(variant => variant.ProductId == product.Id)
                .ToListAsync(cancellationToken);
            foreach (var variant in variants)
            {
                variant.Color = variant.Sku.EndsWith("-PLUS", StringComparison.OrdinalIgnoreCase)
                    ? seed.AltColor
                    : seed.Color;
                variant.Size = seed.Size;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var orderItems = await dbContext.OrderItems
            .Where(item => item.ProductVariantId != null)
            .Join(
                dbContext.ProductVariants,
                item => item.ProductVariantId!.Value,
                variant => variant.Id,
                (item, variant) => new { item, variant })
            .Join(
                dbContext.Products,
                row => row.variant.ProductId,
                product => product.Id,
                (row, product) => new { row.item, row.variant, product })
            .ToListAsync(cancellationToken);

        foreach (var row in orderItems)
        {
            row.item.ProductName = row.product.Name;
            row.item.VariantDescription = BuildVariantDescription(row.variant);
        }

        var orders = await dbContext.Orders.ToListAsync(cancellationToken);
        foreach (var order in orders.Where(order => order.ShippingAddress.Contains("Ky tuc xa", StringComparison.OrdinalIgnoreCase)))
        {
            order.ShippingAddress = order.ShippingAddress
                .Replace("Ky tuc xa", "Ký túc xá", StringComparison.OrdinalIgnoreCase)
                .Replace("Phong", "Phòng", StringComparison.OrdinalIgnoreCase)
                .Replace("Ha Noi", "Hà Nội", StringComparison.OrdinalIgnoreCase);
        }

        foreach (var order in orders.Where(order => order.Note == "Giao trong gio hanh chinh."))
        {
            order.Note = "Giao trong giờ hành chính.";
        }

        foreach (var order in orders.Where(order => order.CancellationReason == "Khach thay doi nhu cau."))
        {
            order.CancellationReason = "Khách thay đổi nhu cầu.";
        }

        var histories = await dbContext.OrderStatusHistories.ToListAsync(cancellationToken);
        foreach (var history in histories)
        {
            history.Note = history.Note switch
            {
                "Order created." => "Đơn hàng được tạo.",
                "Seed development order status." => "Trạng thái đơn hàng mẫu.",
                "Customer cancelled." => "Khách hàng đã hủy đơn.",
                _ => history.Note
            };
        }

        var reviews = await dbContext.Reviews.ToListAsync(cancellationToken);
        foreach (var review in reviews.Where(review => review.Comment == "San pham dung nhu mo ta, phu hop cho sinh vien."))
        {
            review.Comment = "Sản phẩm đúng như mô tả, phù hợp cho sinh viên.";
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedOrdersAsync(
        AppDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        if (await dbContext.Orders.AnyAsync(cancellationToken))
        {
            return;
        }

        var customers = new List<ApplicationUser>();
        for (var i = 1; i <= 5; i++)
        {
            var customer = await userManager.FindByEmailAsync($"customer{i}@campusstore.local");
            if (customer is not null)
            {
                customers.Add(customer);
            }
        }

        var demoCustomer = await userManager.FindByEmailAsync("customer@campusstore.local");
        if (demoCustomer is not null)
        {
            customers.Add(demoCustomer);
        }

        if (customers.Count == 0)
        {
            return;
        }

        var variants = await dbContext.ProductVariants
            .Where(variant => variant.StockQuantity > 0)
            .OrderBy(variant => variant.Id)
            .Take(30)
            .ToListAsync(cancellationToken);

        var productIds = variants.Select(variant => variant.ProductId).Distinct().ToArray();
        var products = await dbContext.Products
            .Where(product => productIds.Contains(product.Id))
            .ToDictionaryAsync(product => product.Id, cancellationToken);

        if (variants.Count < 2)
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var statuses = new[]
        {
            OrderStatus.Pending,
            OrderStatus.Confirmed,
            OrderStatus.Preparing,
            OrderStatus.Shipping,
            OrderStatus.Completed,
            OrderStatus.Cancelled
        };

        for (var i = 0; i < 20; i++)
        {
            var customer = customers[i % customers.Count];
            var firstVariant = variants[i % variants.Count];
            var secondVariant = variants[(i + 7) % variants.Count];
            var firstProduct = products[firstVariant.ProductId];
            var secondProduct = products[secondVariant.ProductId];
            var firstQuantity = 1 + (i % 2);
            var secondQuantity = 1;
            var subtotal = firstVariant.Price * firstQuantity + secondVariant.Price * secondQuantity;
            var discount = i % 4 == 0 ? Math.Min(30_000, subtotal * 0.1m) : 0;
            var shippingFee = subtotal >= 250_000 ? 0 : 20_000;
            var status = statuses[i % statuses.Length];
            var createdAt = now.AddDays(-i);

            var order = new Order
            {
                OrderCode = $"CS{now:yyyyMMdd}{i + 1:0000}",
                UserId = customer.Id,
                ReceiverName = customer.FullName,
                ReceiverPhone = customer.PhoneNumber ?? "0900000000",
                ShippingAddress = $"Ký túc xá CampusStore, Phòng {100 + i}, Hà Nội",
                Subtotal = subtotal,
                DiscountAmount = discount,
                ShippingFee = shippingFee,
                TotalAmount = subtotal - discount + shippingFee,
                PaymentMethod = i % 3 == 0 ? PaymentMethod.BankTransfer : PaymentMethod.Cod,
                PaymentStatus = status == OrderStatus.Completed ? PaymentStatus.Paid : PaymentStatus.Unpaid,
                OrderStatus = status,
                Note = i % 5 == 0 ? "Giao trong giờ hành chính." : null,
                CancellationReason = status == OrderStatus.Cancelled ? "Khách thay đổi nhu cầu." : null,
                CreatedAt = createdAt,
                UpdatedAt = createdAt.AddHours(2)
            };

            dbContext.Orders.Add(order);
            await dbContext.SaveChangesAsync(cancellationToken);

            var firstItem = new OrderItem
            {
                OrderId = order.Id,
                ProductVariantId = firstVariant.Id,
                ProductName = firstProduct.Name,
                Sku = firstVariant.Sku,
                VariantDescription = BuildVariantDescription(firstVariant),
                UnitPrice = firstVariant.Price,
                Quantity = firstQuantity,
                LineTotal = firstVariant.Price * firstQuantity
            };

            var secondItem = new OrderItem
            {
                OrderId = order.Id,
                ProductVariantId = secondVariant.Id,
                ProductName = secondProduct.Name,
                Sku = secondVariant.Sku,
                VariantDescription = BuildVariantDescription(secondVariant),
                UnitPrice = secondVariant.Price,
                Quantity = secondQuantity,
                LineTotal = secondVariant.Price * secondQuantity
            };

            dbContext.OrderItems.AddRange(firstItem, secondItem);
            dbContext.Payments.Add(new Payment
            {
                OrderId = order.Id,
                Method = order.PaymentMethod,
                Amount = order.TotalAmount,
                Status = order.PaymentStatus,
                TransactionCode = order.PaymentMethod == PaymentMethod.BankTransfer ? $"BT{i + 1:000000}" : null,
                PaidAt = order.PaymentStatus == PaymentStatus.Paid ? createdAt.AddHours(1) : null,
                CreatedAt = createdAt
            });

            dbContext.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                OldStatus = OrderStatus.Pending,
                NewStatus = status,
                ChangedByUserId = customer.Id,
                Note = "Trạng thái đơn hàng mẫu.",
                CreatedAt = createdAt.AddMinutes(15)
            });

            await dbContext.SaveChangesAsync(cancellationToken);

            if (status == OrderStatus.Completed)
            {
                dbContext.Reviews.Add(new Review
                {
                    UserId = customer.Id,
                    OrderItemId = firstItem.Id,
                    ProductId = firstProduct.Id,
                    Rating = 4 + (i % 2),
                    Comment = "Sản phẩm đúng như mô tả, phù hợp cho sinh viên.",
                    IsVisible = true,
                    CreatedAt = createdAt.AddDays(1),
                    UpdatedAt = createdAt.AddDays(1)
                });

                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
    }

    private static string BuildVariantDescription(ProductVariant variant)
    {
        var parts = new[] { variant.Color, variant.Size }.Where(value => !string.IsNullOrWhiteSpace(value));
        return string.Join(", ", parts);
    }

    private static IReadOnlyList<ProductSeed> CreateProductSeeds()
    {
        (string CategorySlug, string Name, string Slug, decimal BasePrice, decimal? SalePrice, string Color, string AltColor, string Size)[] names =
        {
            ("but-viet", "Bút gel Campus 0.5 xanh", "but-gel-campus-0-5-xanh", 12000m, 9900m, "Xanh", "Đen", "0.5mm"),
            ("but-viet", "Bút bi EasyNote đen", "but-bi-easynote-den", 8000m, null, "Đen", "Xanh", "0.7mm"),
            ("but-viet", "Bút highlight pastel 5 màu", "but-highlight-pastel-5-mau", 45000m, 39000m, "Pastel", "Mix", "Set 5"),
            ("but-viet", "Bút chì gỗ HB", "but-chi-go-hb", 6000m, null, "Gỗ", "Vàng", "HB"),
            ("but-viet", "Bút xóa mini", "but-xoa-mini", 18000m, null, "Trắng", "Xanh", "5m"),
            ("so-va-vo", "Vở kẻ ngang A5 120 trang", "vo-ke-ngang-a5-120-trang", 22000m, 19000m, "Trắng", "Xanh", "A5"),
            ("so-va-vo", "Vở kẻ ngang B5 200 trang", "vo-ke-ngang-b5-200-trang", 38000m, null, "Trắng", "Xám", "B5"),
            ("so-va-vo", "Sổ tay planner tuần", "so-tay-planner-tuan", 65000m, 59000m, "Be", "Xanh", "A5"),
            ("so-va-vo", "Sổ lò xo ghi chú", "so-lo-xo-ghi-chu", 32000m, null, "Đỏ", "Đen", "A6"),
            ("so-va-vo", "Tập giấy note sticky", "tap-giay-note-sticky", 25000m, 21000m, "Vàng", "Hồng", "Set"),
            ("dung-cu-hoc-tap", "Thước kẻ 20cm trong suốt", "thuoc-ke-20cm-trong-suot", 10000m, null, "Trong suốt", "Xanh", "20cm"),
            ("dung-cu-hoc-tap", "Compa học sinh có bút chì", "compa-hoc-sinh-co-but-chi", 35000m, 29000m, "Bạc", "Đen", "Standard"),
            ("dung-cu-hoc-tap", "Kéo cắt giấy an toàn", "keo-cat-giay-an-toan", 28000m, null, "Xanh", "Hồng", "Small"),
            ("dung-cu-hoc-tap", "Băng dính trong 12mm", "bang-dinh-trong-12mm", 12000m, null, "Trong suốt", "Vàng", "12mm"),
            ("dung-cu-hoc-tap", "Hộp bút nhựa trong", "hop-but-nhua-trong", 42000m, 36000m, "Trong suốt", "Xám", "Medium"),
            ("hoc-lieu", "Flashcard từ vựng tiếng Anh", "flashcard-tu-vung-tieng-anh", 79000m, 69000m, "Mix", "Xanh", "300 cards"),
            ("hoc-lieu", "Bảng công thức toán A4", "bang-cong-thuc-toan-a4", 25000m, null, "Trắng", "Xanh", "A4"),
            ("hoc-lieu", "Sách note học tập hiệu quả", "sach-note-hoc-tap-hieu-qua", 99000m, 89000m, "Trắng", "Đỏ", "Book"),
            ("hoc-lieu", "Thẻ ghi nhớ 100 tờ", "the-ghi-nho-100-to", 30000m, null, "Trắng", "Vàng", "100"),
            ("hoc-lieu", "Sổ công thức hóa học", "so-cong-thuc-hoa-hoc", 52000m, 47000m, "Xanh", "Trắng", "A5"),
            ("balo-va-tui", "Balo laptop Campus 15 inch", "balo-laptop-campus-15-inch", 320000m, 289000m, "Đen", "Xám", "15 inch"),
            ("balo-va-tui", "Túi tote canvas sinh viên", "tui-tote-canvas-sinh-vien", 89000m, 79000m, "Kem", "Đen", "Standard"),
            ("balo-va-tui", "Túi đựng laptop chống sốc", "tui-dung-laptop-chong-soc", 159000m, 139000m, "Xám", "Xanh", "14 inch"),
            ("balo-va-tui", "Balo gọn nhẹ đi học", "balo-gon-nhe-di-hoc", 240000m, null, "Xanh", "Đen", "20L"),
            ("balo-va-tui", "Ví đựng thẻ sinh viên", "vi-dung-the-sinh-vien", 45000m, null, "Nâu", "Đen", "Mini"),
            ("den-ban", "Đèn bàn LED 3 chế độ", "den-ban-led-3-che-do", 199000m, 179000m, "Trắng", "Đen", "LED"),
            ("den-ban", "Đèn học gấp gọn USB", "den-hoc-gap-gon-usb", 129000m, 109000m, "Trắng", "Xanh", "USB"),
            ("den-ban", "Đèn bàn chống mỏi mắt", "den-ban-chong-moi-mat", 269000m, 239000m, "Đen", "Trắng", "LED"),
            ("den-ban", "Đèn kẹp bàn nhỏ gọn", "den-kep-ban-nho-gon", 99000m, null, "Đen", "Trắng", "Clip"),
            ("den-ban", "Bóng đèn LED thay thế", "bong-den-led-thay-the", 45000m, null, "Trắng", "Vàng", "E27"),
            ("phu-kien-may-tinh", "Chuột không dây silent", "chuot-khong-day-silent", 159000m, 139000m, "Đen", "Trắng", "Wireless"),
            ("phu-kien-may-tinh", "Bàn phím mini Bluetooth", "ban-phim-mini-bluetooth", 299000m, 269000m, "Trắng", "Đen", "Bluetooth"),
            ("phu-kien-may-tinh", "USB 64GB tốc độ cao", "usb-64gb-toc-do-cao", 129000m, 119000m, "Bạc", "Đen", "64GB"),
            ("phu-kien-may-tinh", "Giá đỡ laptop gấp gọn", "gia-do-laptop-gap-gon", 189000m, 169000m, "Bạc", "Đen", "Adjustable"),
            ("phu-kien-may-tinh", "Dây cáp USB-C 1m", "day-cap-usb-c-1m", 79000m, null, "Trắng", "Đen", "1m"),
            ("van-phong-pham", "Bìa hồ sơ trong suốt", "bia-ho-so-trong-suot", 18000m, null, "Trong suốt", "Xanh", "A4"),
            ("van-phong-pham", "Kẹp giấy binder 25mm", "kep-giay-binder-25mm", 22000m, null, "Đen", "Mix", "25mm"),
            ("van-phong-pham", "File kẹp tài liệu A4", "file-kep-tai-lieu-a4", 35000m, 29000m, "Xanh", "Đỏ", "A4"),
            ("van-phong-pham", "Giấy in A4 70gsm", "giay-in-a4-70gsm", 85000m, null, "Trắng", "Trắng", "500 tờ"),
            ("van-phong-pham", "Máy bấm kim mini", "may-bam-kim-mini", 55000m, 49000m, "Xanh", "Đen", "Mini"),
            ("but-viet", "Bút lông đầu tròn", "but-long-dau-tron", 15000m, null, "Đen", "Đỏ", "1.0mm"),
            ("so-va-vo", "Vở dot grid bullet journal", "vo-dot-grid-bullet-journal", 72000m, 65000m, "Xám", "Xanh", "A5"),
            ("dung-cu-hoc-tap", "Bảng tên đeo cổ", "bang-ten-deo-co", 15000m, null, "Xanh", "Đen", "Standard"),
            ("hoc-lieu", "Thẻ học kanji cơ bản", "the-hoc-kanji-co-ban", 89000m, 79000m, "Trắng", "Đỏ", "Set"),
            ("balo-va-tui", "Túi đựng bút canvas", "tui-dung-but-canvas", 39000m, null, "Kem", "Xanh", "Small"),
            ("den-ban", "Đèn ngủ học tập mini", "den-ngu-hoc-tap-mini", 119000m, 99000m, "Trắng", "Hồng", "Mini"),
            ("phu-kien-may-tinh", "Pad chuột size lớn", "pad-chuot-size-lon", 69000m, null, "Đen", "Xám", "Large"),
            ("van-phong-pham", "Dao rọc giấy an toàn", "dao-roc-giay-an-toan", 26000m, null, "Vàng", "Đen", "Small"),
            ("so-va-vo", "Sổ tay bìa cứng cao cấp", "so-tay-bia-cung-cao-cap", 98000m, 89000m, "Nâu", "Đen", "A5"),
            ("dung-cu-hoc-tap", "Set dụng cụ hình học", "set-dung-cu-hinh-hoc", 59000m, 52000m, "Trong suốt", "Xanh", "Set"),
            ("hoc-lieu", "Bộ sticker đánh dấu sách", "bo-sticker-danh-dau-sach", 29000m, null, "Mix", "Pastel", "Set")
        };

        return names
            .Select(item => new ProductSeed(
                item.Item1,
                item.Item2,
                item.Item3,
                $"Sản phẩm {item.Item2.ToLowerInvariant()} dành cho học tập và làm việc hằng ngày.",
                item.Item4,
                item.Item5,
                item.Item6,
                item.Item7,
                item.Item8))
            .ToArray();
    }

    private sealed record ProductSeed(
        string CategorySlug,
        string Name,
        string Slug,
        string Description,
        decimal BasePrice,
        decimal? SalePrice,
        string Color,
        string AltColor,
        string Size);
}
