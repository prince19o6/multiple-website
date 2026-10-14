using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Services;

public interface IBookingService
{
    Task<IEnumerable<Booking>> GetAllBookingsAsync();
    Task<Booking?> GetBookingByIdAsync(string id);
    Task<Booking?> GetBookingByReferenceAsync(string reference);
    Task CreateBookingAsync(Booking booking);
    Task UpdateBookingAsync(string id, Booking booking);
    Task DeleteBookingAsync(string id);
}
