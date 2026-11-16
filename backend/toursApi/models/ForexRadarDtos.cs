using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class ForexCounterRate
    {
        [JsonPropertyName("currencyCode")]
        public string CurrencyCode { get; set; } = string.Empty;

        [JsonPropertyName("currencyName")]
        public string CurrencyName { get; set; } = string.Empty;

        [JsonPropertyName("flagEmoji")]
        public string FlagEmoji { get; set; } = string.Empty;

        [JsonPropertyName("bankAirportBuyRate")]
        public decimal BankAirportBuyRate { get; set; }

        [JsonPropertyName("cityCounterBuyRate")]
        public decimal CityCounterBuyRate { get; set; }

        [JsonPropertyName("cityCounterSellRate")]
        public decimal CityCounterSellRate { get; set; }

        [JsonPropertyName("spreadPercent")]
        public string SpreadPercent { get; set; } = string.Empty;

        [JsonPropertyName("airportLossPercent")]
        public string AirportLossPercent { get; set; } = string.Empty;

        [JsonPropertyName("noteConditionTips")]
        public string NoteConditionTips { get; set; } = string.Empty;
    }

    public class AtmDccTip
    {
        [JsonPropertyName("tipKey")]
        public string TipKey { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("severity")]
        public string Severity { get; set; } = "CRITICAL"; // CRITICAL, RECOMMENDED, TIP

        [JsonPropertyName("actionPrompt")]
        public string ActionPrompt { get; set; } = string.Empty;

        [JsonPropertyName("explanation")]
        public string Explanation { get; set; } = string.Empty;

        [JsonPropertyName("atmWithdrawalFeeNotice")]
        public string AtmWithdrawalFeeNotice { get; set; } = string.Empty;
    }

    public class ForexKioskItem
    {
        [JsonPropertyName("kioskId")]
        public string KioskId { get; set; } = string.Empty;

        [JsonPropertyName("brandName")]
        public string BrandName { get; set; } = string.Empty;

        [JsonPropertyName("branchName")]
        public string BranchName { get; set; } = string.Empty;

        [JsonPropertyName("city")]
        public string City { get; set; } = string.Empty;

        [JsonPropertyName("address")]
        public string Address { get; set; } = string.Empty;

        [JsonPropertyName("operatingHours")]
        public string OperatingHours { get; set; } = string.Empty;

        [JsonPropertyName("isAirportBasementKiosk")]
        public bool IsAirportBasementKiosk { get; set; }

        [JsonPropertyName("googleMapsQuery")]
        public string GoogleMapsQuery { get; set; } = string.Empty;

        [JsonPropertyName("rating")]
        public double Rating { get; set; }

        [JsonPropertyName("highlightBadge")]
        public string HighlightBadge { get; set; } = string.Empty;
    }

    public class ForexRadarDataDto
    {
        [JsonPropertyName("destinationCountry")]
        public string DestinationCountry { get; set; } = string.Empty;

        [JsonPropertyName("destinationCurrencyCode")]
        public string DestinationCurrencyCode { get; set; } = string.Empty;

        [JsonPropertyName("destinationCurrencySymbol")]
        public string DestinationCurrencySymbol { get; set; } = string.Empty;

        [JsonPropertyName("lastUpdated")]
        public string LastUpdated { get; set; } = string.Empty;

        [JsonPropertyName("passportRuleNotice")]
        public string PassportRuleNotice { get; set; } = string.Empty;

        [JsonPropertyName("baseRates")]
        public List<ForexCounterRate> BaseRates { get; set; } = new();

        [JsonPropertyName("atmDccShield")]
        public List<AtmDccTip> AtmDccShield { get; set; } = new();

        [JsonPropertyName("verifiedKiosks")]
        public List<ForexKioskItem> VerifiedKiosks { get; set; } = new();
    }
}
