using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class PackageFilterParams
{
    public string? Destination { get; set; }
    public string? Category { get; set; }
    public int? DurationDays { get; set; }
    public double? MinPrice { get; set; }
    public double? MaxPrice { get; set; }
    public bool? PureVegOnly { get; set; }
    public bool? JainOnly { get; set; }
    public string? Sort { get; set; } // "price_asc", "price_desc", "rating_desc", "popular"
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class PackagePagedResult
{
    public List<Package> Items { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)System.Math.Ceiling((double)Total / PageSize);
}

public interface IPackageRepository
{
    Task<PackagePagedResult> GetPackagesAsync(PackageFilterParams filters);
    Task<Package?> GetPackageBySlugAsync(string slug);
    Task<Package?> GetPackageByIdAsync(string id);
    Task<List<string>> AutocompleteAsync(string query, int limit = 8);
    Task CreatePackageAsync(Package package);
    Task<bool> UpdatePackageAsync(string id, Package package);
    Task<bool> DeletePackageAsync(string id);
}

