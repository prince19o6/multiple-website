using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IBannerRepository
{
    Task<List<Banner>> GetBannersAsync(string? module = null, bool activeOnly = true);
    Task<Banner?> GetByIdAsync(string id);
    Task<Banner> CreateAsync(Banner banner);
    Task<bool> UpdateAsync(string id, Banner banner);
    Task<bool> DeleteAsync(string id);
    Task<bool> ToggleActiveAsync(string id);
    Task<bool> ReorderAsync(List<string> orderedIds);
}
