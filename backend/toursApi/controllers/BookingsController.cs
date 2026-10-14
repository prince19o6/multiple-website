using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly ITourService _tourService;
    private readonly IWebsiteContext _websiteContext;

    public BookingsController(IBookingService bookingService, ITourService tourService, IWebsiteContext websiteContext)
    {
        _bookingService = bookingService;
        _tourService = tourService;
        _websiteContext = websiteContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? email, [FromQuery] string? ids, [FromQuery] string? status, [FromQuery] string? search)
    {
        var authEmail = User?.FindFirst(ClaimTypes.Email)?.Value;
        var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isAuthenticated = User?.Identity?.IsAuthenticated == true;
        var isAdmin = User?.IsInRole("Admin") == true;

        if (isAdmin)
        {
            var tokenWebsiteId = User?.FindFirst("websiteId")?.Value;
            if (!string.Equals(tokenWebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    success = false,
                    error = "Access denied: session belongs to a different website."
                });
            }

            var allBookings = (await _bookingService.GetAllBookingsAsync()).ToList();
            var query = allBookings.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(b => string.Equals(b.Status, status, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(b =>
                    (!string.IsNullOrEmpty(b.GuestName) && b.GuestName.Contains(term, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(b.Email) && b.Email.Contains(term, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(b.TourName) && b.TourName.Contains(term, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(b.Reference) && b.Reference.Contains(term, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(b.Id) && b.Id.Contains(term, StringComparison.OrdinalIgnoreCase)));
            }

            var adminList = query.OrderByDescending(b => b.CreatedAt ?? b.StartDate).ToList();

            return Ok(new
            {
                success = true,
                data = adminList,
                count = adminList.Count
            });
        }

        var targetEmail = !string.IsNullOrWhiteSpace(email) ? email.Trim() : (isAuthenticated ? authEmail : null);

        var idSet = !string.IsNullOrWhiteSpace(ids)
            ? ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                 .ToHashSet(StringComparer.OrdinalIgnoreCase)
            : new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (!isAuthenticated && string.IsNullOrWhiteSpace(targetEmail) && idSet.Count == 0)
        {
            return Unauthorized(new
            {
                success = false,
                error = "Authentication, guest email, or booking IDs filter required."
            });
        }

        try
        {
            var bookings = await _bookingService.GetAllBookingsAsync();
            var filtered = bookings.Where(b =>
            {
                if (idSet.Count > 0 && !string.IsNullOrWhiteSpace(b.Id) && idSet.Contains(b.Id))
                {
                    return true;
                }

                if (!string.IsNullOrWhiteSpace(targetEmail) && string.Equals(b.Email, targetEmail, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                if (!string.IsNullOrWhiteSpace(authUserId) && string.Equals(b.UserId, authUserId, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                return false;
            })
            .OrderByDescending(b => b.CreatedAt ?? b.StartDate)
            .ToList();

            return Ok(new { success = true, data = filtered, count = filtered.Count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id);
            if (booking is null)
            {
                booking = await _bookingService.GetBookingByReferenceAsync(id);
            }

            if (booking is null)
            {
                return NotFound(new { success = false, error = "Booking not found" });
            }

            return Ok(new { success = true, data = booking });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BookingCreateDto dto)
    {
        try
        {
            if (dto.StartDate == default)
            {
                dto.StartDate = DateTime.UtcNow.AddDays(7);
            }

            if (dto.EndDate == default || dto.EndDate < dto.StartDate)
            {
                dto.EndDate = dto.StartDate.AddDays(5);
            }

            if (dto.TourId <= 0)
            {
                dto.TourId = 1;
            }

            if (string.IsNullOrWhiteSpace(dto.GuestName) ||
                string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.Phone) ||
                dto.Travelers <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    error = "Missing required fields: guestName, email, phone, travelers",
                });
            }

            string tourName = dto.TourName ?? string.Empty;
            double totalPrice = dto.TotalPrice ?? 0;
            string? tourImage = dto.TourImage;
            string? currency = dto.Currency;
            string? location = dto.Location;

            if (string.IsNullOrWhiteSpace(tourName) ||
                totalPrice <= 0 ||
                string.IsNullOrWhiteSpace(tourImage) ||
                string.IsNullOrWhiteSpace(currency))
            {
                var dbTour = await _tourService.GetTourByNumericIdAsync(dto.TourId);
                if (dbTour == null)
                {
                    dbTour = await _tourService.GetTourByIdAsync(dto.TourId.ToString());
                }

                if (dbTour is not null)
                {
                    if (string.IsNullOrWhiteSpace(tourName))
                    {
                        tourName = !string.IsNullOrWhiteSpace(dbTour.Name) ? dbTour.Name : (dbTour.Title ?? "Tour");
                    }

                    if (totalPrice <= 0)
                    {
                        var unitPrice = dbTour.DiscountedPrice.HasValue && dbTour.DiscountedPrice > 0 ? dbTour.DiscountedPrice.Value : dbTour.Price;
                        totalPrice = unitPrice * Math.Max(1, dto.Travelers);
                    }

                    if (string.IsNullOrWhiteSpace(tourImage))
                    {
                        tourImage = dbTour.Image;
                    }

                    if (string.IsNullOrWhiteSpace(currency))
                    {
                        currency = !string.IsNullOrWhiteSpace(dbTour.Currency) ? dbTour.Currency : "$";
                    }

                    if (string.IsNullOrWhiteSpace(location))
                    {
                        location = !string.IsNullOrWhiteSpace(dbTour.Destination) ? dbTour.Destination : dbTour.Location;
                    }
                }
            }

            if (totalPrice <= 0)
            {
                totalPrice = dto.Travelers * 499;
            }

            if (string.IsNullOrWhiteSpace(tourName))
            {
                tourName = "Guided Tour Expedition";
            }

            var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var finalUserId = !string.IsNullOrWhiteSpace(dto.UserId) ? dto.UserId : authUserId;

            var paymentMethod = !string.IsNullOrWhiteSpace(dto.PaymentMethod) ? dto.PaymentMethod.Trim().ToLowerInvariant() : null;
            string bookingStatus = "pending";
            string paymentStatus = "unpaid";
            string? paymentRef = dto.PaymentReference;
            DateTime? paidAt = null;

            if (!string.IsNullOrWhiteSpace(paymentMethod))
            {
                if (paymentMethod == "pay_on_arrival")
                {
                    bookingStatus = "confirmed";
                    paymentStatus = "unpaid";
                    paymentRef ??= $"POA-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
                }
                else
                {
                    bookingStatus = "confirmed";
                    paymentStatus = "paid";
                    paidAt = DateTime.UtcNow;
                    paymentRef ??= $"TXN-{Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()}";
                }
            }

            var booking = new Booking
            {
                TourId = dto.TourId,
                TourName = tourName,
                TourImage = tourImage,
                Currency = currency ?? "$",
                Location = location ?? "Global",
                GuestName = dto.GuestName.Trim(),
                Email = dto.Email.Trim(),
                Phone = dto.Phone.Trim(),
                Travelers = dto.Travelers,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                TotalPrice = totalPrice,
                UserId = finalUserId,
                Status = bookingStatus,
                PaymentMethod = paymentMethod,
                PaymentStatus = paymentStatus,
                PaymentReference = paymentRef,
                PaidAt = paidAt,
                WebsiteId = _websiteContext.CurrentWebsiteId,
            };

            await _bookingService.CreateBookingAsync(booking);
            return StatusCode(201, new { success = true, data = booking });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    [HttpPost("{id}/pay")]
    public async Task<IActionResult> ProcessPayment(string id, [FromBody] BookingPaymentDto dto)
    {
        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id);
            if (booking == null)
            {
                return NotFound(new { success = false, error = "Booking not found" });
            }

            var method = !string.IsNullOrWhiteSpace(dto.Method) ? dto.Method.Trim().ToLowerInvariant() : "card";
            booking.PaymentMethod = method;
            booking.PaymentStatus = method == "pay_on_arrival" ? "unpaid" : "paid";
            booking.Status = "confirmed";
            booking.PaymentReference = !string.IsNullOrWhiteSpace(dto.TransactionId)
                ? dto.TransactionId
                : $"TXN-{Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()}";
            booking.PaidAt = method == "pay_on_arrival" ? null : DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            await _bookingService.UpdateBookingAsync(id, booking);

            return Ok(new
            {
                success = true,
                message = "Payment processed and booking confirmed successfully.",
                data = booking
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPatch("{id}/cancel")]
    public async Task<IActionResult> Cancel(string id, [FromQuery] string? email)
    {
        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id);
            if (booking == null)
            {
                return NotFound(new { success = false, error = "Booking not found" });
            }

            var authEmail = User?.FindFirst(ClaimTypes.Email)?.Value;
            var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAuthenticated = User?.Identity?.IsAuthenticated == true;

            if (isAuthenticated && !string.IsNullOrWhiteSpace(authUserId) && !string.IsNullOrWhiteSpace(booking.UserId))
            {
                if (!string.Equals(booking.UserId, authUserId, StringComparison.OrdinalIgnoreCase))
                {
                    return Forbid();
                }
            }
            else if (!string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(booking.Email))
            {
                if (!string.Equals(booking.Email, email.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    return Forbid();
                }
            }

            booking.Status = "cancelled";
            booking.UpdatedAt = DateTime.UtcNow;
            await _bookingService.UpdateBookingAsync(id, booking);

            return Ok(new { success = true, data = booking, message = "Booking cancelled successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(string id, [FromBody] BookingUpdateDto dto)
    {
        var tokenWebsiteId = User?.FindFirst("websiteId")?.Value;
        if (!string.Equals(tokenWebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Access denied: session belongs to a different website." });
        }

        try
        {
            var existing = await _bookingService.GetBookingByIdAsync(id);
            if (existing == null)
            {
                return NotFound(new { success = false, error = "Booking not found" });
            }

            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                existing.Status = dto.Status.Trim().ToLowerInvariant();
            }

            existing.UpdatedAt = DateTime.UtcNow;
            await _bookingService.UpdateBookingAsync(id, existing);

            return Ok(new { success = true, data = existing, message = "Booking status updated successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var tokenWebsiteId = User?.FindFirst("websiteId")?.Value;
        if (!string.Equals(tokenWebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Access denied: session belongs to a different website." });
        }

        try
        {
            var existing = await _bookingService.GetBookingByIdAsync(id);
            if (existing == null)
            {
                return NotFound(new { success = false, error = "Booking not found" });
            }

            await _bookingService.DeleteBookingAsync(id);
            return Ok(new { success = true, message = "Booking deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }
}