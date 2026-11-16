using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class GroupMemberDto
    {
        [JsonPropertyName("memberId")]
        public string MemberId { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("avatarUrl")]
        public string AvatarUrl { get; set; } = string.Empty;

        [JsonPropertyName("role")]
        public string Role { get; set; } = "Traveler"; // "Leader", "Co-Planner", "Traveler"

        [JsonPropertyName("dietaryTag")]
        public string DietaryTag { get; set; } = "None"; // "Strict Jain", "100% Pure Veg", "Halal Certified", "Vegan", "Gluten-Free", "None"

        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        [JsonPropertyName("rsvpStatus")]
        public string RsvpStatus { get; set; } = "Confirmed"; // "Confirmed", "Tentative", "Invited"
    }

    public class PollOptionDto
    {
        [JsonPropertyName("optionId")]
        public string OptionId { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("subtitle")]
        public string Subtitle { get; set; } = string.Empty;

        [JsonPropertyName("votesCount")]
        public int VotesCount { get; set; }

        [JsonPropertyName("votePercent")]
        public int VotePercent { get; set; }

        [JsonPropertyName("votedMemberNames")]
        public List<string> VotedMemberNames { get; set; } = new();
    }

    public class GroupPollDto
    {
        [JsonPropertyName("pollId")]
        public string PollId { get; set; } = string.Empty;

        [JsonPropertyName("question")]
        public string Question { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Activity"; // "Activity", "Dining", "Timing", "Budget"

        [JsonPropertyName("options")]
        public List<PollOptionDto> Options { get; set; } = new();

        [JsonPropertyName("totalVotes")]
        public int TotalVotes { get; set; }

        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; } = true;

        [JsonPropertyName("createdBy")]
        public string CreatedBy { get; set; } = "Trip Leader";
    }

    public class GroupGearItemDto
    {
        [JsonPropertyName("itemId")]
        public string ItemId { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "General"; // "Electronics", "Medical/Safety", "Snacks & Food", "Religious/Puja", "Documentation"

        [JsonPropertyName("assignedToMemberName")]
        public string AssignedToMemberName { get; set; } = string.Empty;

        [JsonPropertyName("isPacked")]
        public bool IsPacked { get; set; }
    }

    public class DietarySummaryItemDto
    {
        [JsonPropertyName("dietType")]
        public string DietType { get; set; } = string.Empty;

        [JsonPropertyName("count")]
        public int Count { get; set; }

        [JsonPropertyName("memberNames")]
        public List<string> MemberNames { get; set; } = new();

        [JsonPropertyName("diningTip")]
        public string DiningTip { get; set; } = string.Empty;
    }

    public class GroupTripDto
    {
        [JsonPropertyName("groupId")]
        public string GroupId { get; set; } = string.Empty;

        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("groupName")]
        public string GroupName { get; set; } = string.Empty;

        [JsonPropertyName("destination")]
        public string Destination { get; set; } = string.Empty;

        [JsonPropertyName("travelDates")]
        public string TravelDates { get; set; } = string.Empty;

        [JsonPropertyName("inviteCode")]
        public string InviteCode { get; set; } = string.Empty;

        [JsonPropertyName("shareableInviteUrl")]
        public string ShareableInviteUrl { get; set; } = string.Empty;

        [JsonPropertyName("members")]
        public List<GroupMemberDto> Members { get; set; } = new();

        [JsonPropertyName("polls")]
        public List<GroupPollDto> Polls { get; set; } = new();

        [JsonPropertyName("gearItems")]
        public List<GroupGearItemDto> GearItems { get; set; } = new();

        [JsonPropertyName("dietarySummary")]
        public List<DietarySummaryItemDto> DietarySummary { get; set; } = new();

        [JsonPropertyName("totalEstimatedCost")]
        public string TotalEstimatedCost { get; set; } = string.Empty;

        [JsonPropertyName("perPersonEstimatedCost")]
        public string PerPersonEstimatedCost { get; set; } = string.Empty;
    }

    public class CastVoteRequestDto
    {
        [JsonPropertyName("groupId")]
        public string? GroupId { get; set; }

        [JsonPropertyName("pollId")]
        public string PollId { get; set; } = string.Empty;

        [JsonPropertyName("optionId")]
        public string OptionId { get; set; } = string.Empty;

        [JsonPropertyName("voterName")]
        public string VoterName { get; set; } = "Guest Co-Traveler";
    }

    public class ToggleGearRequestDto
    {
        [JsonPropertyName("groupId")]
        public string? GroupId { get; set; }

        [JsonPropertyName("itemId")]
        public string ItemId { get; set; } = string.Empty;

        [JsonPropertyName("isPacked")]
        public bool IsPacked { get; set; }
    }

    public class CreateGearItemRequestDto
    {
        [JsonPropertyName("groupId")]
        public string? GroupId { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "General";

        [JsonPropertyName("assignedToMemberName")]
        public string AssignedToMemberName { get; set; } = string.Empty;
    }
}
