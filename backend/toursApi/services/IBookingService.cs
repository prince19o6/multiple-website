using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Services;

public interface IBookingService
{
    Task<IEnumerable<Booking>> GetAllBookingsAsync();
    Task<IEnumerable<Booking>> QueryBookingsAsync(
        string? email = null,
        string? userId = null,
        IEnumerable<string>? ids = null,
        string? status = null,
        string? search = null,
        int? skip = null,
        int? limit = null);
    Task<Booking?> GetBookingByIdAsync(string id);
    Task<Booking?> GetBookingByReferenceAsync(string reference);
    Task CreateBookingAsync(Booking booking);
    Task UpdateBookingAsync(string id, Booking booking);
    Task DeleteBookingAsync(string id);
}
