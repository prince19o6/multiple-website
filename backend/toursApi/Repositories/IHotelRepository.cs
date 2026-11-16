using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class HotelFilterParams
{
    public string? Destination { get; set; }
    public string? PropertyType { get; set; }
    public string? Collection { get; set; }
    public int? StarRating { get; set; }
    public double? MinPrice { get; set; }
    public double? MaxPrice { get; set; }
    public bool? PureVegOnly { get; set; }
    public bool? JainOnly { get; set; }
    public List<string>? Amenities { get; set; }
    public string? Sort { get; set; } // "price_asc", "price_desc", "rating_desc", "popular"
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class HotelPagedResult
{
    public List<Hotel> Items { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)System.Math.Ceiling((double)Total / PageSize);
}

public class CityHotelCount
{
    public string CityName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public int Count { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public double StartingPrice { get; set; }
    public string Currency { get; set; } = "INR";
}

public class HotelCollectionsResponse
{
    public List<CityHotelCount> TopCities { get; set; } = new();
    public Dictionary<string, List<Hotel>> Collections { get; set; } = new();
}

public interface IHotelRepository
{
    Task<HotelPagedResult> GetHotelsAsync(HotelFilterParams filters);
    Task<Hotel?> GetHotelBySlugAsync(string slug);
    Task<Hotel?> GetHotelByIdAsync(string id);
    Task<HotelCollectionsResponse> GetCollectionsAsync();
    Task<List<string>> AutocompleteAsync(string query, int limit = 8);
    Task CreateHotelAsync(Hotel hotel);
    Task<bool> UpdateHotelAsync(string id, Hotel hotel);
    Task<bool> DeleteHotelAsync(string id);
    Task UpsertHotelBySlugAsync(Hotel hotel);
    Task<long> DeleteDemoHotelsAsync();
}

