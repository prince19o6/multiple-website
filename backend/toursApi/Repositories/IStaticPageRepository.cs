using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IStaticPageRepository
{
    Task<List<StaticPage>> GetAllPagesAsync(bool activeOnly = false);
    Task<StaticPage?> GetBySlugAsync(string slug);
    Task<StaticPage?> GetByIdAsync(string id);
    Task<StaticPage> CreateAsync(StaticPage page);
    Task<bool> UpdateAsync(string id, StaticPage page);
    Task<bool> DeleteAsync(string id);
}
