using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IPartnerRepository
{
    Task<List<Partner>> GetPartnersAsync(string? category = null, bool activeOnly = true);
    Task<Partner?> GetByIdAsync(string id);
    Task<Partner> CreateAsync(Partner partner);
    Task<bool> UpdateAsync(string id, Partner partner);
    Task<bool> DeleteAsync(string id);
    Task<bool> ToggleActiveAsync(string id);
}
