using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class AirlineBaggagePolicyDto
    {
        [JsonPropertyName("airlineCode")]
        public string AirlineCode { get; set; } = "6E";

        [JsonPropertyName("airlineName")]
        public string AirlineName { get; set; } = "IndiGo";

        [JsonPropertyName("cabinAllowanceKg")]
        public double CabinAllowanceKg { get; set; } = 7.0;

        [JsonPropertyName("cabinPieceCount")]
        public int CabinPieceCount { get; set; } = 1;

        [JsonPropertyName("cabinDimensions")]
        public string CabinDimensions { get; set; } = "55 x 35 x 25 cm (Max 115 cm total)";

        [JsonPropertyName("checkedAllowanceKg")]
        public double CheckedAllowanceKg { get; set; } = 15.0;

        [JsonPropertyName("checkedPieceLimit")]
        public string CheckedPieceLimit { get; set; } = "1 Piece (Max 158 cm total)";

        [JsonPropertyName("airportExcessFeePerKg")]
        public string AirportExcessFeePerKg { get; set; } = "₹600 INR / ~300 THB per kg";

        [JsonPropertyName("prepaidExcessFeePerKg")]
        public string PrepaidExcessFeePerKg { get; set; } = "₹400 INR / ~200 THB per kg";

        [JsonPropertyName("specialRules")]
        public List<string> SpecialRules { get; set; } = new();
    }

    public class BaggageHubDataDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("defaultAirline")]
        public AirlineBaggagePolicyDto DefaultAirline { get; set; } = new();

        [JsonPropertyName("supportedAirlines")]
        public List<AirlineBaggagePolicyDto> SupportedAirlines { get; set; } = new();

        [JsonPropertyName("prohibitedCabinItems")]
        public List<string> ProhibitedCabinItems { get; set; } = new();

        [JsonPropertyName("prohibitedCheckedItems")]
        public List<string> ProhibitedCheckedItems { get; set; } = new();

        [JsonPropertyName("packingTips")]
        public List<string> PackingTips { get; set; } = new();
    }

    public class CalculateBaggageFeeRequestDto
    {
        [JsonPropertyName("airlineCode")]
        public string AirlineCode { get; set; } = "6E";

        [JsonPropertyName("cabinWeightKg")]
        public double CabinWeightKg { get; set; } = 6.5;

        [JsonPropertyName("checkedWeightKg")]
        public double CheckedWeightKg { get; set; } = 14.0;

        [JsonPropertyName("fareClass")]
        public string FareClass { get; set; } = "Economy_Standard"; // "Economy_Light" | "Economy_Standard" | "Flexi_Business"
    }

    public class CalculateBaggageFeeResultDto
    {
        [JsonPropertyName("isCabinOverweight")]
        public bool IsCabinOverweight { get; set; } = false;

        [JsonPropertyName("cabinExcessKg")]
        public double CabinExcessKg { get; set; } = 0.0;

        [JsonPropertyName("isCheckedOverweight")]
        public bool IsCheckedOverweight { get; set; } = false;

        [JsonPropertyName("checkedExcessKg")]
        public double CheckedExcessKg { get; set; } = 0.0;

        [JsonPropertyName("airportCounterFeeEst")]
        public string AirportCounterFeeEst { get; set; } = "₹0";

        [JsonPropertyName("prepaidFeeEst")]
        public string PrepaidFeeEst { get; set; } = "₹0";

        [JsonPropertyName("potentialSavings")]
        public string PotentialSavings { get; set; } = "₹0";

        [JsonPropertyName("verdictStatus")]
        public string VerdictStatus { get; set; } = "Under_Limit_Safe"; // "Under_Limit_Safe" | "Cabin_Heavy_Warning" | "Checked_Overweight_Penalty"

        [JsonPropertyName("headline")]
        public string Headline { get; set; } = "Baggage Within Allowances";

        [JsonPropertyName("recommendation")]
        public string Recommendation { get; set; } = string.Empty;
    }
}
