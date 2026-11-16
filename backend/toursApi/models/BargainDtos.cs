using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class BargainCategoryItem
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("categoryName")]
        public string CategoryName { get; set; } = string.Empty;

        [JsonPropertyName("icon")]
        public string Icon { get; set; } = string.Empty;

        [JsonPropertyName("typicalItems")]
        public string TypicalItems { get; set; } = string.Empty;

        [JsonPropertyName("benchmarkPriceRange")]
        public string BenchmarkPriceRange { get; set; } = string.Empty;

        [JsonPropertyName("bargainMarginPercent")]
        public int BargainMarginPercent { get; set; } = 30; // 0 - 60%

        [JsonPropertyName("strategyTip")]
        public string StrategyTip { get; set; } = string.Empty;
    }

    public class BargainMarketItem
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("marketName")]
        public string MarketName { get; set; } = string.Empty;

        [JsonPropertyName("city")]
        public string City { get; set; } = string.Empty;

        [JsonPropertyName("marketType")]
        public string MarketType { get; set; } = string.Empty; // "Night Market", "Weekend Market", "Traditional Souk"

        [JsonPropertyName("bargainingStrictness")]
        public string BargainingStrictness { get; set; } = "High"; // "High", "Moderate", "Fixed"

        [JsonPropertyName("expectedDiscount")]
        public string ExpectedDiscount { get; set; } = string.Empty; // e.g. "30% - 50% Off Quoted"

        [JsonPropertyName("openingHours")]
        public string OpeningHours { get; set; } = string.Empty;

        [JsonPropertyName("locationArea")]
        public string LocationArea { get; set; } = string.Empty;

        [JsonPropertyName("paymentAdvice")]
        public string PaymentAdvice { get; set; } = string.Empty;

        [JsonPropertyName("insiderSecret")]
        public string InsiderSecret { get; set; } = string.Empty;

        [JsonPropertyName("bestBuys")]
        public List<string> BestBuys { get; set; } = new List<string>();
    }

    public class BargainPhraseItem
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("englishMeaning")]
        public string EnglishMeaning { get; set; } = string.Empty;

        [JsonPropertyName("phonetic")]
        public string Phonetic { get; set; } = string.Empty;

        [JsonPropertyName("localScript")]
        public string LocalScript { get; set; } = string.Empty;

        [JsonPropertyName("contextAdvice")]
        public string ContextAdvice { get; set; } = string.Empty;
    }

    public class BargainingRuleItem
    {
        [JsonPropertyName("ruleNumber")]
        public string RuleNumber { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("icon")]
        public string Icon { get; set; } = string.Empty;
    }

    public class BargainHubDto
    {
        [JsonPropertyName("city")]
        public string City { get; set; } = string.Empty;

        [JsonPropertyName("destinationCountry")]
        public string DestinationCountry { get; set; } = string.Empty;

        [JsonPropertyName("currencyCode")]
        public string CurrencyCode { get; set; } = string.Empty;

        [JsonPropertyName("currencySymbol")]
        public string CurrencySymbol { get; set; } = string.Empty;

        [JsonPropertyName("cultureSummary")]
        public string CultureSummary { get; set; } = string.Empty;

        [JsonPropertyName("rules")]
        public List<BargainingRuleItem> Rules { get; set; } = new List<BargainingRuleItem>();

        [JsonPropertyName("categories")]
        public List<BargainCategoryItem> Categories { get; set; } = new List<BargainCategoryItem>();

        [JsonPropertyName("famousMarkets")]
        public List<BargainMarketItem> FamousMarkets { get; set; } = new List<BargainMarketItem>();

        [JsonPropertyName("keyPhrases")]
        public List<BargainPhraseItem> KeyPhrases { get; set; } = new List<BargainPhraseItem>();
    }
}
