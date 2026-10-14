using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IWebsiteContext _websiteContext;

    public UsersController(IUserRepository userRepository, IWebsiteContext websiteContext)
    {
        _userRepository = userRepository;
        _websiteContext = websiteContext;
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
                error = "Access denied: your session belongs to a different website tenant."
            });
            return false;
        }

        forbiddenResult = null;
        return true;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        var websiteId = _websiteContext.CurrentWebsiteId;
        var users = await _userRepository.GetAllAsync();

        var sanitized = users.Select(u => new
        {
            id = u.Id,
            name = u.Name,
            email = u.Email,
            phone = u.Phone,
            role = u.Role,
            websiteId = websiteId,
            status = !string.IsNullOrWhiteSpace(u.Status) ? u.Status : (u.IsDisabled ? "disabled" : "active"),
            isDisabled = u.IsDisabled,
            createdAt = u.CreatedAt
        }).ToList();

        return Ok(new
        {
            success = true,
            data = sanitized,
            count = sanitized.Count
        });
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateUserRoleDto dto)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        if (string.IsNullOrWhiteSpace(dto.Role))
        {
            return BadRequest(new { success = false, error = "Role is required." });
        }

        var normalizedRole = dto.Role.Trim().ToLowerInvariant();
        if (normalizedRole != "admin" && normalizedRole != "user")
        {
            return BadRequest(new { success = false, error = "Valid roles are: Admin, User." });
        }

        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { success = false, error = "User not found on this website." });
        }

        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.Equals(currentUserId, id, StringComparison.OrdinalIgnoreCase) && normalizedRole == "user")
        {
            return BadRequest(new { success = false, error = "Cannot demote your own active admin account." });
        }

        var targetRole = normalizedRole == "admin" ? "Admin" : "user";
        await _userRepository.UpdateRoleAsync(id, targetRole);

        user.Role = targetRole;

        return Ok(new
        {
            success = true,
            message = $"User role updated to '{targetRole}'.",
            data = new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role,
                status = user.Status,
                isDisabled = user.IsDisabled
            }
        });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateUserStatusDto dto)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { success = false, error = "User not found on this website." });
        }

        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.Equals(currentUserId, id, StringComparison.OrdinalIgnoreCase) && dto.IsDisabled)
        {
            return BadRequest(new { success = false, error = "Cannot disable your own active admin account." });
        }

        var status = dto.IsDisabled ? "disabled" : "active";
        await _userRepository.UpdateStatusAsync(id, dto.IsDisabled, status);

        user.IsDisabled = dto.IsDisabled;
        user.Status = status;

        return Ok(new
        {
            success = true,
            message = $"User status updated to '{(dto.IsDisabled ? "disabled" : "active")}'.",
            data = new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role,
                status = user.Status,
                isDisabled = user.IsDisabled
            }
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.Equals(currentUserId, id, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { success = false, error = "Cannot delete your own active admin account." });
        }

        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { success = false, error = "User not found on this website." });
        }

        await _userRepository.DeleteAsync(id);

        return Ok(new
        {
            success = true,
            message = "User deleted successfully from this website."
        });
    }
}

public class UpdateUserRoleDto
{
    public required string Role { get; set; }
}

public class UpdateUserStatusDto
{
    public bool IsDisabled { get; set; }
}
