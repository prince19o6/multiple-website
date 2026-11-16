using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class DressCodeRuleDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("siteType")]
        public string SiteType { get; set; } = "Buddhist_Temple"; // "Buddhist_Temple" | "Grand_Palace" | "Islamic_Mosque" | "Hindu_Mandir" | "Balinese_Pura"

        [JsonPropertyName("siteName")]
        public string SiteName { get; set; } = string.Empty;

        [JsonPropertyName("destinationCountry")]
        public string DestinationCountry { get; set; } = "Thailand";

        [JsonPropertyName("shouldersAllowed")]
        public bool ShouldersAllowed { get; set; } = false;

        [JsonPropertyName("shortsAllowed")]
        public bool ShortsAllowed { get; set; } = false;

        [JsonPropertyName("footwearPolicy")]
        public string FootwearPolicy { get; set; } = "Shoes must be removed before entering the inner prayer hall (Viharn).";

        [JsonPropertyName("headwearPolicy")]
        public string HeadwearPolicy { get; set; } = "Remove hats and sunglasses. Hair must be covered for women entering mosques.";

        [JsonPropertyName("sheerTightClothingAllowed")]
        public bool SheerTightClothingAllowed { get; set; } = false;

        [JsonPropertyName("onSiteCoverupAvailable")]
        public bool OnSiteCoverupAvailable { get; set; } = true;

        [JsonPropertyName("onSiteCoverupFee")]
        public string OnSiteCoverupFee { get; set; } = "Sarongs available at entrance for 50 THB deposit (or free loaner).";

        [JsonPropertyName("keyRules")]
        public List<string> KeyRules { get; set; } = new();
    }

    public class CulturalEtiquetteItemDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Sacred_Sites"; // "Sacred_Sites" | "Social_Taboos" | "Legal_Warnings" | "Tipping_Dining" | "Monks_Royalty"

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("shortSummary")]
        public string ShortSummary { get; set; } = string.Empty;

        [JsonPropertyName("fullGuidance")]
        public string FullGuidance { get; set; } = string.Empty;

        [JsonPropertyName("importanceLevel")]
        public string ImportanceLevel { get; set; } = "High_Sacred"; // "Critical_Law" | "High_Sacred" | "Good_Manners"

        [JsonPropertyName("iconName")]
        public string IconName { get; set; } = "shield-checkmark";

        [JsonPropertyName("prohibitedAction")]
        public string ProhibitedAction { get; set; } = string.Empty;

        [JsonPropertyName("recommendedAction")]
        public string RecommendedAction { get; set; } = string.Empty;
    }

    public class MedicationCustomsRuleDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("medicationCategory")]
        public string MedicationCategory { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Carry_Doctor_Letter"; // "Strictly_Prohibited" | "Requires_FDA_Permit" | "Carry_Doctor_Letter"

        [JsonPropertyName("officialGuidance")]
        public string OfficialGuidance { get; set; } = string.Empty;
    }

    public class CultureHubDataDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("destinationCountry")]
        public string DestinationCountry { get; set; } = "Thailand";

        [JsonPropertyName("dressCodeRules")]
        public List<DressCodeRuleDto> DressCodeRules { get; set; } = new();

        [JsonPropertyName("etiquetteGuidelines")]
        public List<CulturalEtiquetteItemDto> EtiquetteGuidelines { get; set; } = new();

        [JsonPropertyName("medicationRules")]
        public List<MedicationCustomsRuleDto> MedicationRules { get; set; } = new();

        [JsonPropertyName("localTippingNorms")]
        public string LocalTippingNorms { get; set; } = string.Empty;

        [JsonPropertyName("sacredAudioGuideText")]
        public string SacredAudioGuideText { get; set; } = string.Empty;
    }

    public class CheckOutfitComplianceRequestDto
    {
        [JsonPropertyName("siteType")]
        public string SiteType { get; set; } = "Buddhist_Temple";

        [JsonPropertyName("isShouldersCovered")]
        public bool IsShouldersCovered { get; set; } = true;

        [JsonPropertyName("isKneesCovered")]
        public bool IsKneesCovered { get; set; } = true;

        [JsonPropertyName("isClothingLooseAndOpaque")]
        public bool IsClothingLooseAndOpaque { get; set; } = true;

        [JsonPropertyName("isFootwearRemovable")]
        public bool IsFootwearRemovable { get; set; } = true;

        [JsonPropertyName("isHeadwearRemovable")]
        public bool IsHeadwearRemovable { get; set; } = true;
    }

    public class CheckOutfitComplianceResultDto
    {
        [JsonPropertyName("isCompliant")]
        public bool IsCompliant { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Pass"; // "Pass" | "Fail_At_Gate" | "Needs_Coverup"

        [JsonPropertyName("verdictTitle")]
        public string VerdictTitle { get; set; } = "Approved For Entry";

        [JsonPropertyName("verdictDetails")]
        public string VerdictDetails { get; set; } = string.Empty;

        [JsonPropertyName("missingItems")]
        public List<string> MissingItems { get; set; } = new();
    }
}
