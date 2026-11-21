using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface ISpecialOfferRepository
{
    Task<List<SpecialOffer>> GetOffersAsync(string? module = null, bool activeOnly = true);
    Task<SpecialOffer?> GetByIdAsync(string id);
    Task<SpecialOffer?> GetByCodeAsync(string code);
    Task<SpecialOffer> CreateAsync(SpecialOffer offer);
    Task<bool> UpdateAsync(string id, SpecialOffer offer);
    Task<bool> DeleteAsync(string id);
    Task<bool> ToggleActiveAsync(string id);
}
