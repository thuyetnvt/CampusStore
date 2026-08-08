using CampusStore.Api.Controllers;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;

namespace CampusStore.IntegrationTests;

public sealed class ApiRouteTests
{
    [Theory]
    [InlineData(typeof(AuthController), "api/auth")]
    [InlineData(typeof(CategoriesController), "api/categories")]
    [InlineData(typeof(HealthController), "api/health")]
    public void Controllers_UseApiPrefixedRoutes(Type controllerType, string expectedRoute)
    {
        var route = controllerType.GetCustomAttribute<RouteAttribute>();

        Assert.NotNull(route);
        Assert.Equal(expectedRoute, route.Template);
    }
}
