using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IReviewRepository
{
    Task<List<Review>> GetReviewsAsync(string? module = null, string? targetId = null, bool activeOnly = true);
    Task<Review?> GetByIdAsync(string id);
    Task<Review> CreateAsync(Review review);
    Task<bool> UpdateAsync(string id, Review review);
    Task<bool> DeleteAsync(string id);
    Task<bool> ToggleActiveAsync(string id);
}
