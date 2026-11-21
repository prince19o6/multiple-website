using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface ITravelVideoRepository
{
    Task<List<TravelVideo>> GetVideosAsync(string? module = null, string? destination = null, bool activeOnly = true);
    Task<TravelVideo?> GetByIdAsync(string id);
    Task<TravelVideo> CreateAsync(TravelVideo video);
    Task<bool> UpdateAsync(string id, TravelVideo video);
    Task<bool> DeleteAsync(string id);
    Task<bool> ToggleActiveAsync(string id);
}
