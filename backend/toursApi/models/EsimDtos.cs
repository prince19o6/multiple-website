using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class EsimPackageDto
    {
        [JsonPropertyName("packageId")]
        public string PackageId { get; set; } = string.Empty;

        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("countryCode")]
        public string CountryCode { get; set; } = "TH";

        [JsonPropertyName("destinationName")]
        public string DestinationName { get; set; } = "Thailand";

        [JsonPropertyName("dataAllowanceGb")]
        public double DataAllowanceGb { get; set; } = 15.0;

        [JsonPropertyName("isUnlimited")]
        public bool IsUnlimited { get; set; }

        [JsonPropertyName("validityDays")]
        public int ValidityDays { get; set; } = 8;

        [JsonPropertyName("price")]
        public double Price { get; set; } = 9.99;

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = "USD";

        [JsonPropertyName("networkType")]
        public string NetworkType { get; set; } = "5G / 4G LTE";

        [JsonPropertyName("carrierPartners")]
        public List<string> CarrierPartners { get; set; } = new();

        [JsonPropertyName("supportsHotspot")]
        public bool SupportsHotspot { get; set; } = true;

        [JsonPropertyName("includesLocalCalls")]
        public bool IncludesLocalCalls { get; set; }

        [JsonPropertyName("callMinutes")]
        public int CallMinutes { get; set; }

        [JsonPropertyName("isPopular")]
        public bool IsPopular { get; set; }
    }

    public class ActiveEsimProfileDto
    {
        [JsonPropertyName("profileId")]
        public string ProfileId { get; set; } = string.Empty;

        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("iccid")]
        public string Iccid { get; set; } = string.Empty;

        [JsonPropertyName("packageTitle")]
        public string PackageTitle { get; set; } = string.Empty;

        [JsonPropertyName("destinationName")]
        public string DestinationName { get; set; } = "Thailand";

        [JsonPropertyName("qrCodeUrl")]
        public string QrCodeUrl { get; set; } = string.Empty;

        [JsonPropertyName("smdpAddress")]
        public string SmdpAddress { get; set; } = "LPA:1$smdp.toursapp.io$";

        [JsonPropertyName("activationCode")]
        public string ActivationCode { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active"; // "Active" | "Installed_Ready" | "Expired"

        [JsonPropertyName("totalDataGb")]
        public double TotalDataGb { get; set; } = 15.0;

        [JsonPropertyName("usedDataGb")]
        public double UsedDataGb { get; set; } = 4.2;

        [JsonPropertyName("remainingDataGb")]
        public double RemainingDataGb { get; set; } = 10.8;

        [JsonPropertyName("expiryDate")]
        public string ExpiryDate { get; set; } = string.Empty;

        [JsonPropertyName("daysRemaining")]
        public int DaysRemaining { get; set; } = 6;

        [JsonPropertyName("carrierName")]
        public string CarrierName { get; set; } = "AIS 5G";

        [JsonPropertyName("apnSetting")]
        public string ApnSetting { get; set; } = "internet";

        [JsonPropertyName("roamingEnabled")]
        public bool RoamingEnabled { get; set; } = true;
    }

    public class AirportWifiGuideDto
    {
        [JsonPropertyName("airportCode")]
        public string AirportCode { get; set; } = "BKK";

        [JsonPropertyName("airportName")]
        public string AirportName { get; set; } = "Bangkok Suvarnabhumi Airport";

        [JsonPropertyName("ssid")]
        public string Ssid { get; set; } = ".@AirportTrueFreeWiFi";

        [JsonPropertyName("loginSteps")]
        public string LoginSteps { get; set; } = "Connect to SSID, open browser, select language, accept terms for 2 hours free high-speed access.";

        [JsonPropertyName("timeLimit")]
        public string TimeLimit { get; set; } = "2 Hours (Renewable)";

        [JsonPropertyName("speedTier")]
        public string SpeedTier { get; set; } = "High-Speed 50 Mbps";

        [JsonPropertyName("helpDeskLocation")]
        public string HelpDeskLocation { get; set; } = "Information Desks on Level 2 (Arrivals) & Level 4 (Departures)";
    }

    public class EsimHubResponseDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("activeProfile")]
        public ActiveEsimProfileDto? ActiveProfile { get; set; }

        [JsonPropertyName("packages")]
        public List<EsimPackageDto> Packages { get; set; } = new();

        [JsonPropertyName("wifiGuides")]
        public List<AirportWifiGuideDto> WifiGuides { get; set; } = new();

        [JsonPropertyName("emergencyUssdCodes")]
        public Dictionary<string, string> EmergencyUssdCodes { get; set; } = new();
    }

    public class ActivateEsimRequestDto
    {
        [JsonPropertyName("packageId")]
        public string PackageId { get; set; } = string.Empty;
    }

    public class TopUpDataRequestDto
    {
        [JsonPropertyName("profileId")]
        public string ProfileId { get; set; } = string.Empty;

        [JsonPropertyName("additionalGb")]
        public double AdditionalGb { get; set; } = 3.0;
    }
}
