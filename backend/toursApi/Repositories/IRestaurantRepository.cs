using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class RestaurantFilterParams
{
    public string? Query { get; set; }
    public string? City { get; set; }
    public string? Cuisine { get; set; }
    public bool? PureVegOnly { get; set; }
    public bool? JainOnly { get; set; }
    public bool? HalalOnly { get; set; }
    public string? PriceRange { get; set; } // "$", "$$", "$$$", "$$$$"
    public double? MinCost { get; set; }
    public double? MaxCost { get; set; }
    public string? Sort { get; set; } // "cost_asc", "cost_desc", "rating_desc", "popular", "newest"
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class RestaurantPagedResult
{
    public List<Restaurant> Items { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)System.Math.Ceiling((double)Total / PageSize);
}

public interface IRestaurantRepository
{
    Task<RestaurantPagedResult> GetRestaurantsAsync(RestaurantFilterParams filters);
    Task<Restaurant?> GetRestaurantBySlugAsync(string slug);
    Task<Restaurant?> GetRestaurantByIdAsync(string id);
    Task<List<string>> AutocompleteCitiesAsync(string query, int limit = 8);
    Task<List<string>> AutocompleteNamesAsync(string query, int limit = 8);
    Task CreateRestaurantAsync(Restaurant restaurant);
    Task<bool> UpdateRestaurantAsync(string id, Restaurant restaurant);
    Task<bool> DeleteRestaurantAsync(string id);
}

