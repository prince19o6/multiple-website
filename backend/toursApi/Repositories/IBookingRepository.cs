using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IBookingRepository
{
    Task<IEnumerable<Booking>> GetAllAsync();
    Task<Booking?> GetByIdAsync(string id);
    Task<Booking?> GetByReferenceAsync(string reference);
    Task CreateAsync(Booking booking);
    Task UpdateAsync(string id, Booking booking);
    Task DeleteAsync(string id);
}
