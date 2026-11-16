using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class JournalEntryDto
    {
        [JsonPropertyName("entryId")]
        public string EntryId { get; set; } = string.Empty;

        [JsonPropertyName("tripId")]
        public string TripId { get; set; } = string.Empty;

        [JsonPropertyName("dayNumber")]
        public int DayNumber { get; set; } = 1;

        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("notes")]
        public string Notes { get; set; } = string.Empty;

        [JsonPropertyName("photoUrl")]
        public string PhotoUrl { get; set; } = string.Empty;

        [JsonPropertyName("locationName")]
        public string LocationName { get; set; } = string.Empty;

        [JsonPropertyName("moodTag")]
        public string MoodTag { get; set; } = "Awestruck"; // "Spiritual & Serene", "Thrilled & Adventurous", "Awestruck", "Relaxed & Peaceful", "Foodie Heaven"

        [JsonPropertyName("authorName")]
        public string AuthorName { get; set; } = "Valued Traveler";

        [JsonPropertyName("likesCount")]
        public int LikesCount { get; set; } = 1;

        [JsonPropertyName("createdAt")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    }

    public class ScrapbookStatsDto
    {
        [JsonPropertyName("stopsCompleted")]
        public int StopsCompleted { get; set; }

        [JsonPropertyName("totalDays")]
        public int TotalDays { get; set; }

        [JsonPropertyName("totalPhotos")]
        public int TotalPhotos { get; set; }

        [JsonPropertyName("audioStoriesPlayed")]
        public int AudioStoriesPlayed { get; set; }

        [JsonPropertyName("stampsEarned")]
        public int StampsEarned { get; set; }

        [JsonPropertyName("signatureDish")]
        public string SignatureDish { get; set; } = string.Empty;

        [JsonPropertyName("distanceTraveledKm")]
        public int DistanceTraveledKm { get; set; }
    }

    public class TripScrapbookDto
    {
        [JsonPropertyName("tripId")]
        public string TripId { get; set; } = string.Empty;

        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("tourName")]
        public string TourName { get; set; } = string.Empty;

        [JsonPropertyName("destination")]
        public string Destination { get; set; } = string.Empty;

        [JsonPropertyName("travelerName")]
        public string TravelerName { get; set; } = string.Empty;

        [JsonPropertyName("heroCoverImage")]
        public string HeroCoverImage { get; set; } = string.Empty;

        [JsonPropertyName("travelDates")]
        public string TravelDates { get; set; } = string.Empty;

        [JsonPropertyName("inspirationalQuote")]
        public string InspirationalQuote { get; set; } = string.Empty;

        [JsonPropertyName("stats")]
        public ScrapbookStatsDto Stats { get; set; } = new();

        [JsonPropertyName("entries")]
        public List<JournalEntryDto> Entries { get; set; } = new();

        [JsonPropertyName("shareableStoryUrl")]
        public string ShareableStoryUrl { get; set; } = string.Empty;
    }

    public class CreateJournalEntryDto
    {
        [JsonPropertyName("tripId")]
        public string? TripId { get; set; }

        [JsonPropertyName("dayNumber")]
        public int DayNumber { get; set; } = 1;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("notes")]
        public string Notes { get; set; } = string.Empty;

        [JsonPropertyName("photoUrl")]
        public string? PhotoUrl { get; set; }

        [JsonPropertyName("locationName")]
        public string LocationName { get; set; } = string.Empty;

        [JsonPropertyName("moodTag")]
        public string? MoodTag { get; set; }

        [JsonPropertyName("authorName")]
        public string? AuthorName { get; set; }
    }
}
