using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class TransferFilterParams
{
    public string? City { get; set; }
    public string? TransferType { get; set; } // "airport", "attraction", "hotel", "intercity"
    public string? VehicleType { get; set; }  // "Sedan", "SUV", "Van", "Luxury"
    public int? Passengers { get; set; }
    public double? MinPrice { get; set; }
    public double? MaxPrice { get; set; }
    public string? Sort { get; set; } // "price_asc", "price_desc", "rating_desc"
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class TransferPagedResult
{
    public List<Transfer> Items { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)System.Math.Ceiling((double)Total / PageSize);
}

public interface ITransferRepository
{
    Task<TransferPagedResult> GetTransfersAsync(TransferFilterParams filters);
    Task<Transfer?> GetTransferBySlugAsync(string slug);
    Task<Transfer?> GetTransferByIdAsync(string id);
    Task<List<string>> AutocompleteLocationsAsync(string query, int limit = 8);
    Task CreateTransferAsync(Transfer transfer);
    Task<bool> UpdateTransferAsync(string id, Transfer transfer);
    Task<bool> DeleteTransferAsync(string id);
}

