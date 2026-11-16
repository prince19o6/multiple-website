using System.Collections.Generic;

namespace ToursApi.Models
{
    public class AudioStoryDto
    {
        public string Id { get; set; } = string.Empty;
        public string SiteId { get; set; } = string.Empty;
        public string? TourId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string Category { get; set; } = "history";
        public int DurationSeconds { get; set; }
        public string FormattedDuration { get; set; } = string.Empty;
        public string AudioUrl { get; set; } = string.Empty;
        public string CoverImage { get; set; } = string.Empty;
        public string Transcript { get; set; } = string.Empty;
        public string NarratorName { get; set; } = string.Empty;
        public string Language { get; set; } = "en";
        public string? LandmarkName { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int PlayCount { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
    }

    public class AudioStoryListenDto
    {
        public string StoryId { get; set; } = string.Empty;
        public int SecondsListened { get; set; }
    }
}
