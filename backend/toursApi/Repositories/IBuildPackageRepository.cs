using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class BuildPackageFilterParams
{
    public string? Query { get; set; }
    public string? Country { get; set; }
    public bool? PopularOnly { get; set; }
    public bool? FeaturedOnly { get; set; }
    public double? MinPrice { get; set; }
    public double? MaxPrice { get; set; }
    public string? Sort { get; set; } // "price_asc", "price_desc", "rating_desc", "popular"
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class BuildPackagePagedResult
{
    public List<BuildPackageOption> Items { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)System.Math.Ceiling((double)Total / PageSize);
}

public interface IBuildPackageRepository
{
    Task<BuildPackagePagedResult> GetBuildPackageOptionsAsync(BuildPackageFilterParams filters);
    Task<BuildPackageOption?> GetBuildPackageOptionBySlugAsync(string slug);
    Task<BuildPackageOption?> GetBuildPackageOptionByIdAsync(string id);
    Task<List<string>> AutocompleteDestinationsAsync(string query, int limit = 8);
    Task CreateBuildPackageOptionAsync(BuildPackageOption option);
    Task<bool> UpdateBuildPackageOptionAsync(string id, BuildPackageOption option);
    Task<bool> DeleteBuildPackageOptionAsync(string id);
}

