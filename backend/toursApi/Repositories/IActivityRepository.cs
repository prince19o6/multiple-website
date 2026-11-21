using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class ActivityFilterParams
{
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? Destination { get; set; }
    public string? City { get; set; }
    public double? MinPrice { get; set; }
    public double? MaxPrice { get; set; }
    public bool? PureVegOnly { get; set; }
    public bool? JainOnly { get; set; }
    public string? Sort { get; set; } // "price_asc", "price_desc", "rating", "popular"
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class ActivityPagedResult
{
    public List<Activity> Items { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)System.Math.Ceiling((double)Total / (PageSize > 0 ? PageSize : 20));
}

public interface IActivityRepository
{
    Task<ActivityPagedResult> GetActivitiesAsync(ActivityFilterParams filters);
    Task<Activity?> GetActivityByIdOrSlugAsync(string idOrSlug);
    Task<List<string>> GetCategoriesAsync();
}
