using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IFaqRepository
{
    Task<List<FaqItem>> GetFaqsAsync(string? category = null, bool activeOnly = true);
    Task<FaqItem?> GetByIdAsync(string id);
    Task<FaqItem> CreateAsync(FaqItem faq);
    Task<bool> UpdateAsync(string id, FaqItem faq);
    Task<bool> DeleteAsync(string id);
    Task<bool> ToggleActiveAsync(string id);
}
