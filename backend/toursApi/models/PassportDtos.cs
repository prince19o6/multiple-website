using System.Collections.Generic;

namespace ToursApi.Models
{
    public class ExpeditionStampDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string IconName { get; set; } = "compass";
        public string ColorHex { get; set; } = "#2563EB";
        public string StampShape { get; set; } = "circle"; // circle, oval, hexagon, shield
        public bool Unlocked { get; set; } = false;
        public string? UnlockedDate { get; set; }
        public int XpReward { get; set; } = 250;
        public string Description { get; set; } = string.Empty;
        public string? Coordinates { get; set; }
    }

    public class MilestoneChallengeDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = "exploration"; // exploration, audio, budget, vault, booking
        public int TargetCount { get; set; } = 1;
        public int CurrentCount { get; set; } = 0;
        public bool IsCompleted { get; set; } = false;
        public int XpReward { get; set; } = 150;
        public string IconName { get; set; } = "trophy-outline";
    }

    public class LoyaltyTierDto
    {
        public string TierName { get; set; } = "Bronze Explorer"; // Bronze Explorer, Silver Adventurer, Gold Globetrotter, Platinum VIP Pioneer
        public string TierBadgeColor { get; set; } = "#D97706";
        public int CurrentXp { get; set; } = 750;
        public int NextTierXp { get; set; } = 1500;
        public int ProgressPercent { get; set; } = 50;
        public List<string> Perks { get; set; } = new List<string>();
    }

    public class PassportProfileDto
    {
        public string PassportNumber { get; set; } = string.Empty;
        public string HolderName { get; set; } = "Guest Explorer";
        public string SiteId { get; set; } = string.Empty;
        public string BrandCrestTitle { get; set; } = string.Empty;
        public LoyaltyTierDto Tier { get; set; } = new LoyaltyTierDto();
        public int TotalStampsCount { get; set; }
        public int UnlockedStampsCount { get; set; }
        public List<ExpeditionStampDto> Stamps { get; set; } = new List<ExpeditionStampDto>();
        public List<MilestoneChallengeDto> Challenges { get; set; } = new List<MilestoneChallengeDto>();
        public string IssuedDate { get; set; } = string.Empty;
    }

    public class ClaimStampRequestDto
    {
        public string StampId { get; set; } = string.Empty;
    }

    public class ClaimChallengeRequestDto
    {
        public string ChallengeId { get; set; } = string.Empty;
    }
}
