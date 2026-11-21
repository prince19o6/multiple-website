using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class FlightFilterParams
{
    public string? From { get; set; }
    public string? To { get; set; }
    public string? Date { get; set; }
    public string? CabinClass { get; set; }
    public string? Airline { get; set; }
    public bool? NonStopOnly { get; set; }
    public bool? PureVegMealsOnly { get; set; }
    public double? MinPrice { get; set; }
    public double? MaxPrice { get; set; }
    public string? Sort { get; set; } // "price_asc", "price_desc", "duration_asc", "departure_asc"
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class FlightPagedResult
{
    public List<Flight> Items { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)System.Math.Ceiling((double)Total / PageSize);
}

public interface IFlightRepository
{
    Task<FlightPagedResult> GetFlightsAsync(FlightFilterParams filters);
    Task<Flight?> GetFlightBySlugAsync(string slug);
    Task<Flight?> GetFlightByIdAsync(string id);
    Task<List<Flight>> GetFlightsByRouteAsync(string routeSlug);
    Task<List<string>> AutocompleteAirportsAsync(string query, int limit = 8);
    Task<List<FlightAirport>> GetAllAirportsAsync();
    Task CreateFlightAsync(Flight flight);
    Task<bool> UpdateFlightAsync(string id, Flight flight);
    Task<bool> DeleteFlightAsync(string id);
}

