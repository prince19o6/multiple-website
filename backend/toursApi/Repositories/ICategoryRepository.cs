using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface ICategoryRepository
{
    Task<List<Category>> GetCategoriesByModuleAsync(string module);
    Task<List<Category>> GetAllCategoriesAsync();
    Task<Category?> GetCategoryBySlugAsync(string module, string slug);
    Task UpsertCategoryAsync(Category category);
    Task<long> DeleteDemoCategoriesAsync();
}

