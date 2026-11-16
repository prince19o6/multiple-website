using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ToursApi.Models
{
    [BsonIgnoreExtraElements]
    public class BudgetExpense
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [BsonElement("clientExpenseId")]
        public string ClientExpenseId { get; set; } = string.Empty;

        [BsonElement("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("amount")]
        public decimal Amount { get; set; }

        [BsonElement("currency")]
        public string Currency { get; set; } = "INR";

        [BsonElement("category")]
        public string Category { get; set; } = "dining";

        [BsonElement("paymentMethod")]
        public string PaymentMethod { get; set; } = "cash";

        [BsonElement("paidBy")]
        public string PaidBy { get; set; } = string.Empty;

        [BsonElement("splitWith")]
        public List<string> SplitWith { get; set; } = new();

        [BsonElement("date")]
        public string Date { get; set; } = string.Empty;

        [BsonElement("notes")]
        public string? Notes { get; set; }

        [BsonElement("location")]
        public string? Location { get; set; }

        [BsonElement("syncedAt")]
        public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
    }
}
