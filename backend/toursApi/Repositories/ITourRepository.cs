using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface ITourRepository
{
    Task<IEnumerable<Tour>> GetAllAsync(
        string? category = null,
        bool? featured = null,
        bool? popular = null,
        int? page = null,
        int? limit = null,
        string? sort = null);

    Task<int> GetCountAsync(
        string? category = null,
        bool? featured = null,
        bool? popular = null);

    Task<Tour?> GetByIdAsync(string id);
    Task<Tour?> GetBySlugAsync(string slug);
    Task<Tour?> GetByNumericIdAsync(int numericId);
    Task CreateAsync(Tour tour);
    Task<bool> UpsertBySlugAsync(Tour tour);
    Task UpdateAsync(string id, Tour tour);
    Task DeleteAsync(string id);
    Task<IEnumerable<Tour>> SearchAsync(string? q, double? minPrice, double? maxPrice, string? difficulty);
}
