using System.Threading.Tasks;

namespace ToursApi.Services;

/// <summary>
/// Generates human-friendly, collision-safe, atomic user codes per tenant (e.g. GT-U-000123).
/// Uses an atomic MongoDB findOneAndUpdate on the counters collection.
/// </summary>
public interface IUserCodeGenerator
{
    Task<string> NextUserCodeAsync(string websiteId);
}

