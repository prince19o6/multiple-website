using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class VisaFilterParams
{
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? Country { get; set; }
    public string? CountryCode { get; set; }
    public string? VisaType { get; set; } // "tourist", "express", "business", "transit", "multiple-entry"
    public string? Continent { get; set; }
    public double? MinPrice { get; set; }
    public double? MaxPrice { get; set; }
    public string? Sort { get; set; } // "price_asc", "price_desc", "rating_desc", "popular"
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class VisaPagedResult
{
    public List<Visa> Items { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)System.Math.Ceiling((double)Total / PageSize);
}

public class CountryVisaSummary
{
    public string Country { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string CountrySlug { get; set; } = string.Empty;
    public string Flag { get; set; } = string.Empty;
    public string Continent { get; set; } = string.Empty;
    public double StartingPrice { get; set; }
    public string Currency { get; set; } = "INR";
    public double ApprovalRate { get; set; }
    public int TotalOptions { get; set; }
    public string SampleImage { get; set; } = string.Empty;
}

public interface IVisaRepository
{
    Task<VisaPagedResult> GetVisasAsync(VisaFilterParams filters);
    Task<List<CountryVisaSummary>> GetCountrySummariesAsync();
    Task<List<Visa>> GetVisasByCountrySlugAsync(string countrySlug);
    Task<Visa?> GetVisaBySlugAsync(string slug);
    Task<Visa?> GetVisaByIdAsync(string id);
    Task<List<string>> AutocompleteCountriesAsync(string query, int limit = 8);
    Task CreateVisaAsync(Visa visa);
    Task<bool> UpdateVisaAsync(string id, Visa visa);
    Task<bool> DeleteVisaAsync(string id);
}

