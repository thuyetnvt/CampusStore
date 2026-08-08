using Microsoft.AspNetCore.Mvc;

namespace CampusStore.Api.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "Healthy",
            service = "CampusStore.Api",
            utcTime = DateTimeOffset.UtcNow
        });
    }
}
