using CampusStore.Application;
using CampusStore.Infrastructure;
using CampusStore.Infrastructure.Seeding;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    await DevelopmentDataSeeder.SeedAsync(app.Services);
}

app.Run();
