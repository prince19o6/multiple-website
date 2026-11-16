using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class CarbonEmissionBreakdownDto
    {
        [JsonPropertyName("flightEmissionsKg")]
        public double FlightEmissionsKg { get; set; } = 420.5;

        [JsonPropertyName("groundTransportEmissionsKg")]
        public double GroundTransportEmissionsKg { get; set; } = 38.2;

        [JsonPropertyName("hotelStayEmissionsKg")]
        public double HotelStayEmissionsKg { get; set; } = 64.0;

        [JsonPropertyName("totalEmissionsKg")]
        public double TotalEmissionsKg { get; set; } = 522.7;

        [JsonPropertyName("treesEquivalentCount")]
        public int TreesEquivalentCount { get; set; } = 26;

        [JsonPropertyName("carKmEquivalent")]
        public int CarKmEquivalent { get; set; } = 2150;
    }

    public class VerifiedClimateProjectDto
    {
        [JsonPropertyName("projectId")]
        public string ProjectId { get; set; } = string.Empty;

        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("location")]
        public string Location { get; set; } = string.Empty;

        [JsonPropertyName("standard")]
        public string Standard { get; set; } = "Gold Standard";

        [JsonPropertyName("pricePerTonneUsd")]
        public double PricePerTonneUsd { get; set; } = 14.50;

        [JsonPropertyName("pricePerTonneLocal")]
        public string PricePerTonneLocal { get; set; } = "$14.50 USD";

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("impactMetric")]
        public string ImpactMetric { get; set; } = string.Empty;

        [JsonPropertyName("badgeAwarded")]
        public string BadgeAwarded { get; set; } = "Green Guardian";

        [JsonPropertyName("iconName")]
        public string IconName { get; set; } = "leaf";
    }

    public class OffsetContributionDto
    {
        [JsonPropertyName("contributionId")]
        public string ContributionId { get; set; } = string.Empty;

        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("travelerName")]
        public string TravelerName { get; set; } = string.Empty;

        [JsonPropertyName("bookingId")]
        public string BookingId { get; set; } = string.Empty;

        [JsonPropertyName("projectId")]
        public string ProjectId { get; set; } = string.Empty;

        [JsonPropertyName("projectName")]
        public string ProjectName { get; set; } = string.Empty;

        [JsonPropertyName("offsetAmountKg")]
        public double OffsetAmountKg { get; set; }

        [JsonPropertyName("amountPaidUsd")]
        public double AmountPaidUsd { get; set; }

        [JsonPropertyName("certificateNumber")]
        public string CertificateNumber { get; set; } = string.Empty;

        [JsonPropertyName("certifiedDate")]
        public string CertifiedDate { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Verified_Retired";
    }

    public class EcoPledgeItemDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Oceans"; // "Oceans" | "Wildlife" | "PlasticFree" | "Heritage"

        [JsonPropertyName("isPledged")]
        public bool IsPledged { get; set; }

        [JsonPropertyName("iconName")]
        public string IconName { get; set; } = "leaf";
    }

    public class EcoHubDataDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("defaultFlightRoute")]
        public string DefaultFlightRoute { get; set; } = "BOM ✈ BKK";

        [JsonPropertyName("emissions")]
        public CarbonEmissionBreakdownDto Emissions { get; set; } = new();

        [JsonPropertyName("projects")]
        public List<VerifiedClimateProjectDto> Projects { get; set; } = new();

        [JsonPropertyName("myContributions")]
        public List<OffsetContributionDto> MyContributions { get; set; } = new();

        [JsonPropertyName("pledges")]
        public List<EcoPledgeItemDto> Pledges { get; set; } = new();

        [JsonPropertyName("ecoExplorerLevel")]
        public string EcoExplorerLevel { get; set; } = "Eco Pioneer";

        [JsonPropertyName("totalKgOffset")]
        public double TotalKgOffset { get; set; } = 522.7;
    }

    public class CalculateEmissionsRequestDto
    {
        [JsonPropertyName("originAirport")]
        public string OriginAirport { get; set; } = "BOM";

        [JsonPropertyName("destinationAirport")]
        public string DestinationAirport { get; set; } = "BKK";

        [JsonPropertyName("flightClass")]
        public string FlightClass { get; set; } = "Economy"; // "Economy" | "PremiumEconomy" | "Business"

        [JsonPropertyName("nightsCount")]
        public int NightsCount { get; set; } = 5;

        [JsonPropertyName("paxCount")]
        public int PaxCount { get; set; } = 2;
    }

    public class SubmitOffsetRequestDto
    {
        [JsonPropertyName("projectId")]
        public string ProjectId { get; set; } = string.Empty;

        [JsonPropertyName("travelerName")]
        public string TravelerName { get; set; } = string.Empty;

        [JsonPropertyName("bookingId")]
        public string BookingId { get; set; } = string.Empty;

        [JsonPropertyName("offsetAmountKg")]
        public double OffsetAmountKg { get; set; } = 500;
    }

    public class TogglePledgeRequestDto
    {
        [JsonPropertyName("pledgeId")]
        public string PledgeId { get; set; } = string.Empty;

        [JsonPropertyName("isPledged")]
        public bool IsPledged { get; set; }
    }
}
