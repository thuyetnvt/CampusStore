using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CampusStore.Infrastructure.Persistence;

public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        var connectionString = Environment.GetEnvironmentVariable("CAMPUSSTORE_CONNECTION_STRING")
            ?? "Server=localhost;Port=3306;Database=campusstore_dev;User=campusstore;Password=YOUR_PASSWORD;CharSet=utf8mb4;";

        optionsBuilder.UseMySQL(connectionString);

        return new AppDbContext(optionsBuilder.Options);
    }
}
