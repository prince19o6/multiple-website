using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ToursApi.Models
{
    [BsonIgnoreExtraElements]
    public class TaxRefundReceipt
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("claimId")]
        public string ClaimId { get; set; } = string.Empty;

        [BsonElement("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [BsonElement("storeName")]
        public string StoreName { get; set; } = string.Empty;

        [BsonElement("storeBranch")]
        public string StoreBranch { get; set; } = string.Empty;

        [BsonElement("purchaseDate")]
        public string PurchaseDate { get; set; } = string.Empty;

        [BsonElement("invoiceNumber")]
        public string InvoiceNumber { get; set; } = string.Empty;

        [BsonElement("taxFormNumber")]
        public string TaxFormNumber { get; set; } = string.Empty;

        [BsonElement("category")]
        public string Category { get; set; } = "Shopping";

        [BsonElement("purchaseAmount")]
        public double PurchaseAmount { get; set; }

        [BsonElement("estimatedRefundAmount")]
        public double EstimatedRefundAmount { get; set; }

        [BsonElement("currency")]
        public string Currency { get; set; } = "THB";

        [BsonElement("status")]
        public string Status { get; set; } = "Draft"; // "Draft", "Customs_Inspected", "Refund_Claimed"

        [BsonElement("requiresPhysicalInspection")]
        public bool RequiresPhysicalInspection { get; set; }

        [BsonElement("receiptImageUrl")]
        public string ReceiptImageUrl { get; set; } = string.Empty;

        [BsonElement("notes")]
        public string Notes { get; set; } = string.Empty;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
