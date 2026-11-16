using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ToursApi.Models
{
    [BsonIgnoreExtraElements]
    public class ActiveEsimProfile
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("profileId")]
        public string ProfileId { get; set; } = string.Empty;

        [BsonElement("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [BsonElement("iccid")]
        public string Iccid { get; set; } = string.Empty;

        [BsonElement("packageTitle")]
        public string PackageTitle { get; set; } = string.Empty;

        [BsonElement("destinationName")]
        public string DestinationName { get; set; } = "Thailand";

        [BsonElement("qrCodeUrl")]
        public string QrCodeUrl { get; set; } = string.Empty;

        [BsonElement("smdpAddress")]
        public string SmdpAddress { get; set; } = "LPA:1$smdp.toursapp.io$";

        [BsonElement("activationCode")]
        public string ActivationCode { get; set; } = string.Empty;

        [BsonElement("status")]
        public string Status { get; set; } = "Active";

        [BsonElement("totalDataGb")]
        public double TotalDataGb { get; set; } = 15.0;

        [BsonElement("usedDataGb")]
        public double UsedDataGb { get; set; } = 4.2;

        [BsonElement("expiryDate")]
        public string ExpiryDate { get; set; } = string.Empty;

        [BsonElement("daysRemaining")]
        public int DaysRemaining { get; set; } = 6;

        [BsonElement("carrierName")]
        public string CarrierName { get; set; } = "AIS 5G";

        [BsonElement("apnSetting")]
        public string ApnSetting { get; set; } = "internet";

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
