using System.Collections.Generic;

namespace ToursApi.Models
{
    public class DestinationLandmarkFilterDto
    {
        public string? Category { get; set; }
        public int? TourId { get; set; }
        public string? Search { get; set; }
        public bool? FeaturedOnly { get; set; }
    }

    public class DestinationWaypointsResponseDto
    {
        public bool Success { get; set; }
        public string SiteId { get; set; } = string.Empty;
        public int TotalLandmarks { get; set; }
        public List<string> Categories { get; set; } = new();
        public List<DestinationLandmark> Landmarks { get; set; } = new();
    }
}
