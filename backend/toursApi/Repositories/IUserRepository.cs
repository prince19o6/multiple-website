using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByRefreshTokenAsync(string refreshToken);
    Task<User?> GetByResetTokenHashAsync(string resetTokenHash);
    Task<List<User>> GetAllAsync();
    Task<User> CreateAsync(User user);
    Task UpdateAsync(User user);
    Task<bool> DeleteAsync(string id);
    Task<bool> UpdateRoleAsync(string id, string newRole);
    Task<bool> UpdateStatusAsync(string id, bool isDisabled, string status);
}
