using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class PlugTypeDto
    {
        [JsonPropertyName("plugType")]
        public string PlugType { get; set; } = "C";

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("pinCount")]
        public int PinCount { get; set; } = 2;

        [JsonPropertyName("isGrounded")]
        public bool IsGrounded { get; set; } = false;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("compatibleWithHomePlugs")]
        public List<string> CompatibleWithHomePlugs { get; set; } = new();

        [JsonPropertyName("needsAdapterForHome")]
        public bool NeedsAdapterForHome { get; set; } = false;
    }

    public class VoltageSpecDto
    {
        [JsonPropertyName("destinationCountry")]
        public string DestinationCountry { get; set; } = "Thailand";

        [JsonPropertyName("standardVoltage")]
        public string StandardVoltage { get; set; } = "220V";

        [JsonPropertyName("standardFrequency")]
        public string StandardFrequency { get; set; } = "50Hz";

        [JsonPropertyName("homeCountryComparison")]
        public string HomeCountryComparison { get; set; } = string.Empty;

        [JsonPropertyName("adapterRequired")]
        public bool AdapterRequired { get; set; } = false;

        [JsonPropertyName("voltageConverterRequired")]
        public bool VoltageConverterRequired { get; set; } = false;
    }

    public class ApplianceVoltageRuleDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("applianceCategory")]
        public string ApplianceCategory { get; set; } = string.Empty;

        [JsonPropertyName("typicalRating")]
        public string TypicalRating { get; set; } = "100V - 240V Dual Voltage";

        [JsonPropertyName("safetyVerdict")]
        public string SafetyVerdict { get; set; } = "Safe_With_Plug_Adapter"; // "Safe_Direct" | "Safe_With_Plug_Adapter" | "High_Burn_Risk_Needs_Converter"

        [JsonPropertyName("safetyWarning")]
        public string SafetyWarning { get; set; } = string.Empty;

        [JsonPropertyName("recommendedAction")]
        public string RecommendedAction { get; set; } = string.Empty;

        [JsonPropertyName("iconName")]
        public string IconName { get; set; } = "phone-portrait";
    }

    public class PowerBankKioskDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("networkName")]
        public string NetworkName { get; set; } = string.Empty;

        [JsonPropertyName("locations")]
        public string Locations { get; set; } = string.Empty;

        [JsonPropertyName("pricing")]
        public string Pricing { get; set; } = string.Empty;

        [JsonPropertyName("cableTypes")]
        public List<string> CableTypes { get; set; } = new();

        [JsonPropertyName("howToUse")]
        public string HowToUse { get; set; } = string.Empty;

        [JsonPropertyName("iconName")]
        public string IconName { get; set; } = "battery-charging";
    }

    public class PowerHubDataDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("destinationCountry")]
        public string DestinationCountry { get; set; } = "Thailand";

        [JsonPropertyName("voltageSpec")]
        public VoltageSpecDto VoltageSpec { get; set; } = new();

        [JsonPropertyName("supportedPlugTypes")]
        public List<PlugTypeDto> SupportedPlugTypes { get; set; } = new();

        [JsonPropertyName("applianceRules")]
        public List<ApplianceVoltageRuleDto> ApplianceRules { get; set; } = new();

        [JsonPropertyName("powerBankKiosks")]
        public List<PowerBankKioskDto> PowerBankKiosks { get; set; } = new();

        [JsonPropertyName("quickTips")]
        public List<string> QuickTips { get; set; } = new();
    }

    public class CheckApplianceRequestDto
    {
        [JsonPropertyName("applianceCategory")]
        public string ApplianceCategory { get; set; } = "Smartphones & Laptops";

        [JsonPropertyName("ratedVoltage")]
        public string RatedVoltage { get; set; } = "100-240V"; // "100-240V" | "110-120V" | "220-240V"

        [JsonPropertyName("homePlugType")]
        public string HomePlugType { get; set; } = "Type_D_India"; // "Type_D_India" | "Type_G_UK_UAE" | "Type_A_US"
    }

    public class CheckApplianceResultDto
    {
        [JsonPropertyName("isSafe")]
        public bool IsSafe { get; set; } = true;

        [JsonPropertyName("verdictStatus")]
        public string VerdictStatus { get; set; } = "Safe_Direct"; // "Safe_Direct" | "Safe_With_Adapter" | "Danger_Burn_Risk"

        [JsonPropertyName("headline")]
        public string Headline { get; set; } = "Safe to Plug In";

        [JsonPropertyName("detailedAdvice")]
        public string DetailedAdvice { get; set; } = string.Empty;

        [JsonPropertyName("plugAdapterNeeded")]
        public bool PlugAdapterNeeded { get; set; } = false;

        [JsonPropertyName("voltageTransformerNeeded")]
        public bool VoltageTransformerNeeded { get; set; } = false;
    }
}
