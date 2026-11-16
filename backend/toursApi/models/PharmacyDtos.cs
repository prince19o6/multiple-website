using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class TravelMedicineDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString("N");

        [JsonPropertyName("genericName")]
        public string GenericName { get; set; } = string.Empty;

        [JsonPropertyName("commonHomeNames")]
        public List<string> CommonHomeNames { get; set; } = new();

        [JsonPropertyName("localBrandNames")]
        public List<string> LocalBrandNames { get; set; } = new();

        [JsonPropertyName("nativeText")]
        public string NativeText { get; set; } = string.Empty;

        [JsonPropertyName("phonetic")]
        public string Phonetic { get; set; } = string.Empty;

        [JsonPropertyName("symptoms")]
        public List<string> Symptoms { get; set; } = new();

        [JsonPropertyName("typicalDosage")]
        public string TypicalDosage { get; set; } = string.Empty;

        [JsonPropertyName("precautions")]
        public string Precautions { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Fever_Pain"; // "Fever_Pain" | "Stomach_Digestion" | "Motion_Sickness" | "Allergy_Bites" | "First_Aid"

        [JsonPropertyName("isRestrictedWarning")]
        public bool IsRestrictedWarning { get; set; } = false;
    }

    public class PharmacyDirectoryDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString("N");

        [JsonPropertyName("pharmacyName")]
        public string PharmacyName { get; set; } = string.Empty;

        [JsonPropertyName("chainName")]
        public string ChainName { get; set; } = "Boots";

        [JsonPropertyName("city")]
        public string City { get; set; } = "Bangkok";

        [JsonPropertyName("address")]
        public string Address { get; set; } = string.Empty;

        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        [JsonPropertyName("isOpen24Hours")]
        public bool IsOpen24Hours { get; set; } = true;

        [JsonPropertyName("operatingHours")]
        public string OperatingHours { get; set; } = "Open 24 Hours";

        [JsonPropertyName("hasEnglishSpeakingPharmacist")]
        public bool HasEnglishSpeakingPharmacist { get; set; } = true;
    }

    public class ControlledSubstanceWarningDto
    {
        [JsonPropertyName("medication")]
        public string Medication { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Strictly Controlled";

        [JsonPropertyName("rule")]
        public string Rule { get; set; } = string.Empty;
    }

    public class PharmacyHubDataDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("city")]
        public string City { get; set; } = "Bangkok";

        [JsonPropertyName("medicines")]
        public List<TravelMedicineDto> Medicines { get; set; } = new();

        [JsonPropertyName("pharmacies")]
        public List<PharmacyDirectoryDto> Pharmacies { get; set; } = new();

        [JsonPropertyName("controlledSubstances")]
        public List<ControlledSubstanceWarningDto> ControlledSubstances { get; set; } = new();

        [JsonPropertyName("emergencyDoctorHotline")]
        public string EmergencyDoctorHotline { get; set; } = "+66 2 207 6000 (Tourist Assistance Medical Line)";

        [JsonPropertyName("emergencyAmbulanceNumber")]
        public string EmergencyAmbulanceNumber { get; set; } = "1669";
    }
}
