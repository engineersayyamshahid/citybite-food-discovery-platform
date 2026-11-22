using CityBite.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace CityBite.Api.Controllers;

/// <summary>
/// Quick check that the API is running and can reach the database.
/// Open http://localhost:5000/api/health (or http://LAPTOP-IP:5000/api/health from a phone).
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        bool dbOk = await db.Database.CanConnectAsync();
        return Ok(new
        {
            api = "running",
            database = dbOk ? "connected" : "not reachable",
            serverTime = DateTime.Now
        });
    }
}
