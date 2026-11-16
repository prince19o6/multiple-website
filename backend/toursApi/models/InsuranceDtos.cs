using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class InsuranceBenefitDto
    {
        [JsonPropertyName("benefitKey")]
        public string BenefitKey { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("coverageLimit")]
        public string CoverageLimit { get; set; } = "$500,000 USD";

        [JsonPropertyName("deductible")]
        public string Deductible { get; set; } = "$0 Zero Deductible";

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("isCovered")]
        public bool IsCovered { get; set; } = true;

        [JsonPropertyName("iconName")]
        public string IconName { get; set; } = "medkit";
    }

    public class HospitalDirectoryDto
    {
        [JsonPropertyName("hospitalId")]
        public string HospitalId { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("city")]
        public string City { get; set; } = "Bangkok";

        [JsonPropertyName("district")]
        public string District { get; set; } = string.Empty;

        [JsonPropertyName("rating")]
        public double Rating { get; set; } = 4.9;

        [JsonPropertyName("address")]
        public string Address { get; set; } = string.Empty;

        [JsonPropertyName("emergencyPhone")]
        public string EmergencyPhone { get; set; } = string.Empty;

        [JsonPropertyName("isCashlessApproved")]
        public bool IsCashlessApproved { get; set; } = true;

        [JsonPropertyName("hasEnglishStaff")]
        public bool HasEnglishStaff { get; set; } = true;

        [JsonPropertyName("hasInterpreter")]
        public bool HasInterpreter { get; set; } = true;

        [JsonPropertyName("specialties")]
        public List<string> Specialties { get; set; } = new();

        [JsonPropertyName("distanceFromCenter")]
        public string DistanceFromCenter { get; set; } = "2.4 km";
    }

    public class InsuranceClaimDocDto
    {
        [JsonPropertyName("docId")]
        public string DocId { get; set; } = string.Empty;

        [JsonPropertyName("claimType")]
        public string ClaimType { get; set; } = "Medical Emergency"; // "Medical Emergency" | "Baggage Loss" | "Flight Delay" | "Trip Cancellation"

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("isRequired")]
        public bool IsRequired { get; set; } = true;

        [JsonPropertyName("isUploaded")]
        public bool IsUploaded { get; set; }

        [JsonPropertyName("fileUrl")]
        public string FileUrl { get; set; } = string.Empty;
    }

    public class TravelInsurancePolicyDto
    {
        [JsonPropertyName("policyId")]
        public string PolicyId { get; set; } = string.Empty;

        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("policyNumber")]
        public string PolicyNumber { get; set; } = string.Empty;

        [JsonPropertyName("underwriterName")]
        public string UnderwriterName { get; set; } = "Allianz Global Assistance";

        [JsonPropertyName("planTier")]
        public string PlanTier { get; set; } = "Comprehensive Platinum Worldwide";

        [JsonPropertyName("policyHolderName")]
        public string PolicyHolderName { get; set; } = "Primary Traveler & Party";

        [JsonPropertyName("beneficiaryCount")]
        public int BeneficiaryCount { get; set; } = 2;

        [JsonPropertyName("startDate")]
        public string StartDate { get; set; } = string.Empty;

        [JsonPropertyName("endDate")]
        public string EndDate { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active"; // "Active" | "Pending" | "Expired"

        [JsonPropertyName("emergencyAssistancePhone")]
        public string EmergencyAssistancePhone { get; set; } = "+1 800 555 0199";

        [JsonPropertyName("emergencyWhatsApp")]
        public string EmergencyWhatsApp { get; set; } = "+1 415 555 0188";

        [JsonPropertyName("claimsEmail")]
        public string ClaimsEmail { get; set; } = "claims@toursapp-insurance.com";

        [JsonPropertyName("cashlessHospitalNetworkUrl")]
        public string CashlessHospitalNetworkUrl { get; set; } = "https://toursapp.com/cashless-network";

        [JsonPropertyName("adventureSportsRider")]
        public bool AdventureSportsRider { get; set; } = true;

        [JsonPropertyName("benefits")]
        public List<InsuranceBenefitDto> Benefits { get; set; } = new();

        [JsonPropertyName("preApprovedHospitals")]
        public List<HospitalDirectoryDto> PreApprovedHospitals { get; set; } = new();

        [JsonPropertyName("requiredClaimDocuments")]
        public List<InsuranceClaimDocDto> RequiredClaimDocuments { get; set; } = new();
    }

    public class SubmitClaimInquiryRequestDto
    {
        [JsonPropertyName("incidentType")]
        public string IncidentType { get; set; } = "Medical Emergency";

        [JsonPropertyName("hospitalName")]
        public string HospitalName { get; set; } = string.Empty;

        [JsonPropertyName("incidentDate")]
        public string IncidentDate { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("estimatedAmount")]
        public double EstimatedAmount { get; set; }

        [JsonPropertyName("contactPhone")]
        public string ContactPhone { get; set; } = string.Empty;
    }
}
