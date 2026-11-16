using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class TransitPhraseDto
    {
        [JsonPropertyName("english")]
        public string English { get; set; } = string.Empty;

        [JsonPropertyName("nativeText")]
        public string NativeText { get; set; } = string.Empty;

        [JsonPropertyName("phonetic")]
        public string Phonetic { get; set; } = string.Empty;
    }

    public class TransitLineDto
    {
        [JsonPropertyName("lineId")]
        public string LineId { get; set; } = string.Empty;

        [JsonPropertyName("lineName")]
        public string LineName { get; set; } = string.Empty;

        [JsonPropertyName("systemType")]
        public string SystemType { get; set; } = "Skytrain"; // "Skytrain" | "Underground_Metro" | "Airport_Train" | "Monorail"

        [JsonPropertyName("colorHex")]
        public string ColorHex { get; set; } = "#10b981";

        [JsonPropertyName("operatingHours")]
        public string OperatingHours { get; set; } = "06:00 - 00:00 Daily";

        [JsonPropertyName("paymentMethods")]
        public List<string> PaymentMethods { get; set; } = new();

        [JsonPropertyName("keyStations")]
        public List<string> KeyStations { get; set; } = new();
    }

    public class TransitRouteQueryDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString("N");

        [JsonPropertyName("originStation")]
        public string OriginStation { get; set; } = string.Empty;

        [JsonPropertyName("destinationStation")]
        public string DestinationStation { get; set; } = string.Empty;

        [JsonPropertyName("estimatedFare")]
        public string EstimatedFare { get; set; } = string.Empty;

        [JsonPropertyName("travelTimeMins")]
        public int TravelTimeMins { get; set; } = 15;

        [JsonPropertyName("transfersRequired")]
        public int TransfersRequired { get; set; } = 0;

        [JsonPropertyName("routeSummary")]
        public string RouteSummary { get; set; } = string.Empty;
    }

    public class TaxiFareEstimatorDto
    {
        [JsonPropertyName("city")]
        public string City { get; set; } = "Bangkok";

        [JsonPropertyName("baseMeterFare")]
        public string BaseMeterFare { get; set; } = "35 THB for 1st km";

        [JsonPropertyName("ratePerKm")]
        public string RatePerKm { get; set; } = "6.50 THB / km (1-10 km), 7.00 THB / km (10-20 km)";

        [JsonPropertyName("airportSurcharge")]
        public string AirportSurcharge { get; set; } = "50 THB official airport surcharge + expressway toll fees (50-75 THB)";

        [JsonPropertyName("scamPreventionTips")]
        public List<string> ScamPreventionTips { get; set; } = new();

        [JsonPropertyName("driverPhrases")]
        public List<TransitPhraseDto> DriverPhrases { get; set; } = new();
    }

    public class TransitHubDataDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("city")]
        public string City { get; set; } = "Bangkok";

        [JsonPropertyName("lines")]
        public List<TransitLineDto> Lines { get; set; } = new();

        [JsonPropertyName("popularRoutes")]
        public List<TransitRouteQueryDto> PopularRoutes { get; set; } = new();

        [JsonPropertyName("taxiGuide")]
        public TaxiFareEstimatorDto TaxiGuide { get; set; } = new();

        [JsonPropertyName("transitPassAdvice")]
        public string TransitPassAdvice { get; set; } = string.Empty;
    }

    public class CalculateTransitFareRequestDto
    {
        [JsonPropertyName("origin")]
        public string Origin { get; set; } = "Siam";

        [JsonPropertyName("destination")]
        public string Destination { get; set; } = "Mo Chit (Chatuchak)";
    }

    public class CalculateTransitFareResultDto
    {
        [JsonPropertyName("origin")]
        public string Origin { get; set; } = string.Empty;

        [JsonPropertyName("destination")]
        public string Destination { get; set; } = string.Empty;

        [JsonPropertyName("fareAmount")]
        public string FareAmount { get; set; } = string.Empty;

        [JsonPropertyName("fareLocalPrice")]
        public double FareLocalPrice { get; set; } = 47.0;

        [JsonPropertyName("currencySymbol")]
        public string CurrencySymbol { get; set; } = "THB";

        [JsonPropertyName("durationMins")]
        public int DurationMins { get; set; } = 16;

        [JsonPropertyName("stopsCount")]
        public int StopsCount { get; set; } = 7;

        [JsonPropertyName("transfers")]
        public int Transfers { get; set; } = 0;

        [JsonPropertyName("recommendedLine")]
        public string RecommendedLine { get; set; } = "BTS Sukhumvit Line (Green)";

        [JsonPropertyName("instruction")]
        public string Instruction { get; set; } = string.Empty;
    }

    public class EstimateTaxiFareRequestDto
    {
        [JsonPropertyName("distanceKm")]
        public double DistanceKm { get; set; } = 10.0;

        [JsonPropertyName("trafficCondition")]
        public string TrafficCondition { get; set; } = "Moderate"; // "Light" | "Moderate" | "Heavy_Gridlock"

        [JsonPropertyName("useExpressway")]
        public bool UseExpressway { get; set; } = true;
    }

    public class EstimateTaxiFareResultDto
    {
        [JsonPropertyName("distanceKm")]
        public double DistanceKm { get; set; } = 10.0;

        [JsonPropertyName("fairMeterRange")]
        public string FairMeterRange { get; set; } = "110 - 140 THB";

        [JsonPropertyName("estimatedTollFees")]
        public string EstimatedTollFees { get; set; } = "50 THB";

        [JsonPropertyName("totalEstimatedCost")]
        public string TotalEstimatedCost { get; set; } = "160 - 190 THB";

        [JsonPropertyName("grabBoltEstimate")]
        public string GrabBoltEstimate { get; set; } = "180 - 230 THB";

        [JsonPropertyName("scamAlertThreshold")]
        public string ScamAlertThreshold { get; set; } = "Above 350 THB (Decline flat-rate offer!)";

        [JsonPropertyName("driverAdvice")]
        public string DriverAdvice { get; set; } = string.Empty;
    }
}
