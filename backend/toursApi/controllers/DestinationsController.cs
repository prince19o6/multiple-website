using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Exceptions;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/destinations")]
public class DestinationsController : ControllerBase
{
    private readonly IDestinationRepository _repo;
    private readonly IWebsiteContext _websiteContext;

    public DestinationsController(IDestinationRepository repo, IWebsiteContext websiteContext)
    {
        _repo = repo;
        _websiteContext = websiteContext;
    }

    private IActionResult HandleException(Exception ex)
    {
        if (ex is MongoDatabaseUnavailableException or MongoException or TimeoutException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                error = "Database unavailable",
                message = $"Failed to connect to MongoDB database '{_websiteContext.DatabaseName}'",
                website = _websiteContext.CurrentWebsiteId,
                dataSource = "mongodb"
            });
        }
        return StatusCode(500, new { success = false, error = ex.Message });
    }

    private bool ValidateTenantAccess(out IActionResult? forbiddenResult)
    {
        var currentWebsiteId = _websiteContext.CurrentWebsiteId;
        var tokenWebsiteId = User.FindFirst("websiteId")?.Value;

        if (!string.Equals(tokenWebsiteId, currentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            forbiddenResult = StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                error = "Access denied: session belongs to a different website tenant."
            });
            return false;
        }

        forbiddenResult = null;
        return true;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var destinations = await _repo.GetAllAsync();
            var list = destinations.ToList();
            return Ok(new { success = true, data = list, count = list.Count });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Create([FromBody] Destination destination)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        try
        {
            destination.Website = _websiteContext.CurrentWebsiteId;
            await _repo.CreateAsync(destination);
            return StatusCode(201, new { success = true, data = destination });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Update(string id, [FromBody] Destination updated)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        try
        {
            updated.Website = _websiteContext.CurrentWebsiteId;
            await _repo.UpdateAsync(id, updated);
            return Ok(new { success = true, data = updated });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        try
        {
            await _repo.DeleteAsync(id);
            return Ok(new { success = true, message = "Destination deleted successfully" });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }
}