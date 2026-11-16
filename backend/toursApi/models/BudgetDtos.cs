using System.Collections.Generic;

namespace ToursApi.Models
{
    public class DestinationCostGuideDto
    {
        public bool Success { get; set; }
        public string SiteId { get; set; } = string.Empty;
        public string DestinationName { get; set; } = string.Empty;
        public string BaseCurrency { get; set; } = "INR";
        public decimal EstimatedDailyBudget { get; set; } = 2500m;
        public Dictionary<string, decimal> CategoryEstimates { get; set; } = new();
        public string TippingEtiquette { get; set; } = string.Empty;
        public string BargainingCulture { get; set; } = string.Empty;
        public List<string> PopularPaymentMethods { get; set; } = new();
    }

    public class ExpenseSyncItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string Category { get; set; } = "dining";
        public string PaymentMethod { get; set; } = "cash";
        public string PaidBy { get; set; } = string.Empty;
        public List<string> SplitWith { get; set; } = new();
        public string Date { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? Location { get; set; }
    }

    public class ExpenseSyncPayloadDto
    {
        public decimal TotalBudget { get; set; }
        public string Currency { get; set; } = "INR";
        public List<ExpenseSyncItemDto> Expenses { get; set; } = new();
    }
}
