using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IDestinationRepository
{
    Task<IEnumerable<Destination>> GetAllAsync();
    Task<Destination?> GetByIdAsync(string id);
    Task CreateAsync(Destination destination);
    Task UpdateAsync(string id, Destination destination);
    Task DeleteAsync(string id);
}