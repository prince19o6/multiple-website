using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class AssignedCrewDto
    {
        [JsonPropertyName("leadGuideName")]
        public string LeadGuideName { get; set; } = string.Empty;

        [JsonPropertyName("guidePhone")]
        public string GuidePhone { get; set; } = string.Empty;

        [JsonPropertyName("guideAvatar")]
        public string GuideAvatar { get; set; } = string.Empty;

        [JsonPropertyName("guideRating")]
        public double GuideRating { get; set; } = 4.9;

        [JsonPropertyName("driverName")]
        public string DriverName { get; set; } = string.Empty;

        [JsonPropertyName("driverPhone")]
        public string DriverPhone { get; set; } = string.Empty;

        [JsonPropertyName("vehicleModel")]
        public string VehicleModel { get; set; } = string.Empty;

        [JsonPropertyName("vehiclePlateNumber")]
        public string VehiclePlateNumber { get; set; } = string.Empty;

        [JsonPropertyName("vehicleColor")]
        public string VehicleColor { get; set; } = string.Empty;

        [JsonPropertyName("luggageCapacity")]
        public string LuggageCapacity { get; set; } = string.Empty;

        [JsonPropertyName("pickupLocation")]
        public string PickupLocation { get; set; } = string.Empty;

        [JsonPropertyName("pickupTime")]
        public string PickupTime { get; set; } = string.Empty;

        [JsonPropertyName("driverStatus")]
        public string DriverStatus { get; set; } = "Waiting at Hotel Lobby";
    }

    public class ExpeditionStopProgressDto
    {
        [JsonPropertyName("stopId")]
        public string StopId { get; set; } = string.Empty;

        [JsonPropertyName("orderIndex")]
        public int OrderIndex { get; set; }

        [JsonPropertyName("stopName")]
        public string StopName { get; set; } = string.Empty;

        [JsonPropertyName("scheduledTime")]
        public string ScheduledTime { get; set; } = string.Empty;

        [JsonPropertyName("estimatedDuration")]
        public string EstimatedDuration { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Upcoming"; // "Completed", "Current", "Upcoming"

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("meetingPointName")]
        public string MeetingPointName { get; set; } = string.Empty;

        [JsonPropertyName("meetingPointNotes")]
        public string MeetingPointNotes { get; set; } = string.Empty;

        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }

        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }

        [JsonPropertyName("audioStoryId")]
        public string? AudioStoryId { get; set; }

        [JsonPropertyName("audioStoryTitle")]
        public string? AudioStoryTitle { get; set; }

        [JsonPropertyName("culinaryTip")]
        public string? CulinaryTip { get; set; }

        [JsonPropertyName("dressCodeReminder")]
        public string? DressCodeReminder { get; set; }
    }

    public class GuideAnnouncementDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; } = string.Empty;

        [JsonPropertyName("priority")]
        public string Priority { get; set; } = "Normal"; // "Normal", "Important", "Urgent"

        [JsonPropertyName("sentBy")]
        public string SentBy { get; set; } = "Lead Tour Guide";
    }

    public class DayOfDispatchDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("tourId")]
        public string TourId { get; set; } = string.Empty;

        [JsonPropertyName("tourName")]
        public string TourName { get; set; } = string.Empty;

        [JsonPropertyName("bookingReference")]
        public string BookingReference { get; set; } = string.Empty;

        [JsonPropertyName("destination")]
        public string Destination { get; set; } = string.Empty;

        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;

        [JsonPropertyName("currentStatusSummary")]
        public string CurrentStatusSummary { get; set; } = string.Empty;

        [JsonPropertyName("overallProgressPercent")]
        public int OverallProgressPercent { get; set; } = 40;

        [JsonPropertyName("assignedCrew")]
        public AssignedCrewDto AssignedCrew { get; set; } = new();

        [JsonPropertyName("stops")]
        public List<ExpeditionStopProgressDto> Stops { get; set; } = new();

        [JsonPropertyName("announcements")]
        public List<GuideAnnouncementDto> Announcements { get; set; } = new();

        [JsonPropertyName("emergencyHotline")]
        public string EmergencyHotline { get; set; } = string.Empty;

        [JsonPropertyName("conciergeDesk")]
        public string ConciergeDesk { get; set; } = string.Empty;
    }

    public class CreateAnnouncementRequestDto
    {
        [JsonPropertyName("tourId")]
        public string? TourId { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("priority")]
        public string Priority { get; set; } = "Normal";

        [JsonPropertyName("sentBy")]
        public string? SentBy { get; set; }
    }
}
