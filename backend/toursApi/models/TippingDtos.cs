using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class TippingServiceCategoryDto
    {
        [JsonPropertyName("categoryKey")]
        public string CategoryKey { get; set; } = string.Empty;

        [JsonPropertyName("categoryName")]
        public string CategoryName { get; set; } = string.Empty;

        [JsonPropertyName("icon")]
        public string Icon { get; set; } = "restaurant-outline";

        [JsonPropertyName("recommendedTip")]
        public string RecommendedTip { get; set; } = string.Empty;

        [JsonPropertyName("customaryRule")]
        public string CustomaryRule { get; set; } = string.Empty;

        [JsonPropertyName("defaultPercentage")]
        public decimal DefaultPercentage { get; set; } = 10m;

        [JsonPropertyName("typicalFixedAmount")]
        public decimal TypicalFixedAmount { get; set; } = 50m;

        [JsonPropertyName("isMandatory")]
        public bool IsMandatory { get; set; } = false;

        [JsonPropertyName("serviceChargeExplanation")]
        public string ServiceChargeExplanation { get; set; } = string.Empty;
    }

    public class TippingCountryGuideDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("country")]
        public string Country { get; set; } = "Thailand";

        [JsonPropertyName("currencyCode")]
        public string CurrencyCode { get; set; } = "THB";

        [JsonPropertyName("currencySymbol")]
        public string CurrencySymbol { get; set; } = "฿";

        [JsonPropertyName("generalTippingCulture")]
        public string GeneralTippingCulture { get; set; } = string.Empty;

        [JsonPropertyName("taxAndServiceChargeNote")]
        public string TaxAndServiceChargeNote { get; set; } = string.Empty;

        [JsonPropertyName("categories")]
        public List<TippingServiceCategoryDto> Categories { get; set; } = new();

        [JsonPropertyName("localThankYouPhrase")]
        public string LocalThankYouPhrase { get; set; } = string.Empty;

        [JsonPropertyName("localThankYouPhonetic")]
        public string LocalThankYouPhonetic { get; set; } = string.Empty;
    }

    public class CalculateTipRequestDto
    {
        [JsonPropertyName("billAmount")]
        public decimal BillAmount { get; set; }

        [JsonPropertyName("categoryKey")]
        public string CategoryKey { get; set; } = "Dining";

        [JsonPropertyName("tipPercentage")]
        public decimal? TipPercentage { get; set; }

        [JsonPropertyName("customTipAmount")]
        public decimal? CustomTipAmount { get; set; }

        [JsonPropertyName("serviceChargeAlreadyIncluded")]
        public bool ServiceChargeAlreadyIncluded { get; set; } = false;

        [JsonPropertyName("splitCount")]
        public int SplitCount { get; set; } = 1;
    }

    public class CalculateTipResultDto
    {
        [JsonPropertyName("billAmount")]
        public decimal BillAmount { get; set; }

        [JsonPropertyName("tipAmount")]
        public decimal TipAmount { get; set; }

        [JsonPropertyName("totalAmount")]
        public decimal TotalAmount { get; set; }

        [JsonPropertyName("splitCount")]
        public int SplitCount { get; set; } = 1;

        [JsonPropertyName("perPersonTotal")]
        public decimal PerPersonTotal { get; set; }

        [JsonPropertyName("perPersonTip")]
        public decimal PerPersonTip { get; set; }

        [JsonPropertyName("serviceChargeNote")]
        public string ServiceChargeNote { get; set; } = string.Empty;

        [JsonPropertyName("etiquetteAdvice")]
        public string EtiquetteAdvice { get; set; } = string.Empty;

        [JsonPropertyName("currencyCode")]
        public string CurrencyCode { get; set; } = "THB";

        [JsonPropertyName("currencySymbol")]
        public string CurrencySymbol { get; set; } = "฿";
    }
}
