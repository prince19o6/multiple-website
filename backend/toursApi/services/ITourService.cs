using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Services;

public interface ITourService
{
    Task<IEnumerable<Tour>> GetAllToursAsync(
        string? category = null,
        bool? featured = null,
        bool? popular = null,
        int? page = null,
        int? limit = null,
        string? sort = null);

    Task<int> GetToursCountAsync(
        string? category = null,
        bool? featured = null,
        bool? popular = null);

    Task<Tour?> GetTourByIdAsync(string id);
    Task<Tour?> GetTourBySlugAsync(string slug);
    Task<Tour?> GetTourByNumericIdAsync(int numericId);
    Task CreateTourAsync(Tour tour);
    Task<bool> UpsertTourBySlugAsync(Tour tour);
    Task UpdateTourAsync(string id, Tour tour);
    Task DeleteTourAsync(string id);
    Task<IEnumerable<Tour>> SearchToursAsync(string? q, double? minPrice, double? maxPrice, string? difficulty, string? sort = null);
    Task<IEnumerable<Tour>> GetSimilarToursAsync(string tourIdOrSlug, int limit = 4);
    Task<GuestReview?> AddReviewAsync(string tourIdOrSlug, GuestReview review);
}
