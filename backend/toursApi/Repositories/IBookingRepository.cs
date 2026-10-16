using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IBookingRepository
{
    Task<IEnumerable<Booking>> GetAllAsync();
    Task<IEnumerable<Booking>> QueryAsync(
        string? email = null,
        string? userId = null,
        IEnumerable<string>? ids = null,
        string? status = null,
        string? search = null,
        int? skip = null,
        int? limit = null);
    Task<Booking?> GetByIdAsync(string id);
    Task<Booking?> GetByReferenceAsync(string reference);
    Task CreateAsync(Booking booking);
    Task UpdateAsync(string id, Booking booking);
    Task DeleteAsync(string id);
}
