using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class ExpeditionWrappedStats
    {
        [JsonPropertyName("travelerName")]
        public string TravelerName { get; set; } = string.Empty;

        [JsonPropertyName("year")]
        public string Year { get; set; } = "2026";

        [JsonPropertyName("totalKmTraveled")]
        public int TotalKmTraveled { get; set; }

        [JsonPropertyName("countriesVisited")]
        public int CountriesVisited { get; set; }

        [JsonPropertyName("citiesExplored")]
        public int CitiesExplored { get; set; }

        [JsonPropertyName("toursCompleted")]
        public int ToursCompleted { get; set; }

        [JsonPropertyName("carbonOffsetKg")]
        public decimal CarbonOffsetKg { get; set; }

        [JsonPropertyName("treesPlantedEquivalent")]
        public int TreesPlantedEquivalent { get; set; }

        [JsonPropertyName("totalBargainingSavings")]
        public decimal TotalBargainingSavings { get; set; }

        [JsonPropertyName("totalVatRefundClaimed")]
        public decimal TotalVatRefundClaimed { get; set; }

        [JsonPropertyName("audioStoriesListenedMinutes")]
        public int AudioStoriesListenedMinutes { get; set; }

        [JsonPropertyName("favoriteCategory")]
        public string FavoriteCategory { get; set; } = string.Empty;

        [JsonPropertyName("topLandmarksVisited")]
        public List<string> TopLandmarksVisited { get; set; } = new();

        [JsonPropertyName("unlockedBadges")]
        public List<string> UnlockedBadges { get; set; } = new();

        [JsonPropertyName("travelerArchetype")]
        public string TravelerArchetype { get; set; } = string.Empty; // e.g. "Eco-Savvy Culture Pioneer", "Royal Heritage Connoisseur"

        [JsonPropertyName("highlightQuote")]
        public string HighlightQuote { get; set; } = string.Empty;
    }

    public class LoyaltyTierData
    {
        [JsonPropertyName("memberId")]
        public string MemberId { get; set; } = string.Empty;

        [JsonPropertyName("memberName")]
        public string MemberName { get; set; } = string.Empty;

        [JsonPropertyName("currentTier")]
        public string CurrentTier { get; set; } = "Gold Globetrotter"; // Bronze Explorer, Silver Adventurer, Gold Globetrotter, Platinum Legend

        [JsonPropertyName("tierBadgeEmoji")]
        public string TierBadgeEmoji { get; set; } = "🌟";

        [JsonPropertyName("currentPoints")]
        public int CurrentPoints { get; set; }

        [JsonPropertyName("pointsToNextTier")]
        public int PointsToNextTier { get; set; }

        [JsonPropertyName("nextTierName")]
        public string NextTierName { get; set; } = "Platinum Legend";

        [JsonPropertyName("progressPercentage")]
        public int ProgressPercentage { get; set; }

        [JsonPropertyName("multiplierBadge")]
        public string MultiplierBadge { get; set; } = "1.5x Points";

        [JsonPropertyName("perks")]
        public List<string> Perks { get; set; } = new();
    }

    public class LoyaltyRewardVoucher
    {
        [JsonPropertyName("voucherId")]
        public string VoucherId { get; set; } = string.Empty;

        [JsonPropertyName("voucherCode")]
        public string VoucherCode { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("discountLabel")]
        public string DiscountLabel { get; set; } = string.Empty;

        [JsonPropertyName("pointsCost")]
        public int PointsCost { get; set; }

        [JsonPropertyName("isClaimed")]
        public bool IsClaimed { get; set; }

        [JsonPropertyName("expiryDate")]
        public string ExpiryDate { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty; // "Booking Discount", "Airport Transfer", "Culinary Pass"
    }

    public class ExpeditionCertificate
    {
        [JsonPropertyName("certificateId")]
        public string CertificateId { get; set; } = string.Empty;

        [JsonPropertyName("recipientName")]
        public string RecipientName { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("citation")]
        public string Citation { get; set; } = string.Empty;

        [JsonPropertyName("issueDate")]
        public string IssueDate { get; set; } = string.Empty;

        [JsonPropertyName("expeditionSignature")]
        public string ExpeditionSignature { get; set; } = string.Empty;

        [JsonPropertyName("goldSealText")]
        public string GoldSealText { get; set; } = string.Empty;
    }

    public class ClaimRewardRequest
    {
        [JsonPropertyName("voucherId")]
        public string VoucherId { get; set; } = string.Empty;

        [JsonPropertyName("voucherCode")]
        public string VoucherCode { get; set; } = string.Empty;

        [JsonPropertyName("pointsCost")]
        public int PointsCost { get; set; }
    }

    public class ReviewBoostRequest
    {
        [JsonPropertyName("tourId")]
        public string TourId { get; set; } = string.Empty;

        [JsonPropertyName("rating")]
        public int Rating { get; set; } = 5;

        [JsonPropertyName("reviewText")]
        public string ReviewText { get; set; } = string.Empty;

        [JsonPropertyName("favoriteMoment")]
        public string FavoriteMoment { get; set; } = string.Empty;
    }

    public class ExpeditionSummaryHubDto
    {
        [JsonPropertyName("destinationHub")]
        public string DestinationHub { get; set; } = string.Empty;

        [JsonPropertyName("currencySymbol")]
        public string CurrencySymbol { get; set; } = string.Empty;

        [JsonPropertyName("wrapped")]
        public ExpeditionWrappedStats Wrapped { get; set; } = new();

        [JsonPropertyName("loyalty")]
        public LoyaltyTierData Loyalty { get; set; } = new();

        [JsonPropertyName("availableRewards")]
        public List<LoyaltyRewardVoucher> AvailableRewards { get; set; } = new();

        [JsonPropertyName("certificate")]
        public ExpeditionCertificate Certificate { get; set; } = new();
    }
}
