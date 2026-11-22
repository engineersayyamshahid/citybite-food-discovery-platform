using CityBite.Api.Data;
using CityBite.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>Areas for the "Choose your area" screen and the restaurant signup form.</summary>
[ApiController]
[Route("api/areas")]
public class AreasController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AreaDto>>> GetAll() =>
        await db.Areas
            .OrderBy(a => a.City).ThenBy(a => a.Name)
            .Select(a => new AreaDto(a.AreaId, a.Name, a.City))
            .ToListAsync();
}
