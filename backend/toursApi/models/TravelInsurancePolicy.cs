using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ToursApi.Models
{
    [BsonIgnoreExtraElements]
    public class TravelInsurancePolicy
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("policyId")]
        public string PolicyId { get; set; } = string.Empty;

        [BsonElement("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [BsonElement("policyNumber")]
        public string PolicyNumber { get; set; } = string.Empty;

        [BsonElement("underwriterName")]
        public string UnderwriterName { get; set; } = string.Empty;

        [BsonElement("planTier")]
        public string PlanTier { get; set; } = string.Empty;

        [BsonElement("policyHolderName")]
        public string PolicyHolderName { get; set; } = string.Empty;

        [BsonElement("beneficiaryCount")]
        public int BeneficiaryCount { get; set; } = 2;

        [BsonElement("startDate")]
        public string StartDate { get; set; } = string.Empty;

        [BsonElement("endDate")]
        public string EndDate { get; set; } = string.Empty;

        [BsonElement("status")]
        public string Status { get; set; } = "Active";

        [BsonElement("emergencyAssistancePhone")]
        public string EmergencyAssistancePhone { get; set; } = string.Empty;

        [BsonElement("emergencyWhatsApp")]
        public string EmergencyWhatsApp { get; set; } = string.Empty;

        [BsonElement("claimsEmail")]
        public string ClaimsEmail { get; set; } = string.Empty;

        [BsonElement("adventureSportsRider")]
        public bool AdventureSportsRider { get; set; } = true;

        [BsonElement("benefits")]
        public List<InsuranceBenefitDto> Benefits { get; set; } = new();

        [BsonElement("preApprovedHospitals")]
        public List<HospitalDirectoryDto> PreApprovedHospitals { get; set; } = new();

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
