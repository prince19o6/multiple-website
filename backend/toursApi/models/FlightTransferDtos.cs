using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class FlightDetailsDto
    {
        [JsonPropertyName("flightNumber")]
        public string FlightNumber { get; set; } = string.Empty;

        [JsonPropertyName("airline")]
        public string Airline { get; set; } = string.Empty;

        [JsonPropertyName("airlineLogo")]
        public string AirlineLogo { get; set; } = string.Empty;

        [JsonPropertyName("originAirportCode")]
        public string OriginAirportCode { get; set; } = string.Empty;

        [JsonPropertyName("originCity")]
        public string OriginCity { get; set; } = string.Empty;

        [JsonPropertyName("destAirportCode")]
        public string DestAirportCode { get; set; } = string.Empty;

        [JsonPropertyName("destCity")]
        public string DestCity { get; set; } = string.Empty;

        [JsonPropertyName("scheduledDeparture")]
        public string ScheduledDeparture { get; set; } = string.Empty;

        [JsonPropertyName("scheduledArrival")]
        public string ScheduledArrival { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "On Time"; // "On Time", "Boarding", "In Flight", "Landed", "Delayed"

        [JsonPropertyName("terminal")]
        public string Terminal { get; set; } = "T1";

        [JsonPropertyName("gate")]
        public string Gate { get; set; } = "G-08";

        [JsonPropertyName("baggageCarousel")]
        public string BaggageCarousel { get; set; } = "Carousel 2";

        [JsonPropertyName("duration")]
        public string Duration { get; set; } = "1h 30m";
    }

    public class TerminalAmenityDto
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("location")]
        public string Location { get; set; } = string.Empty;

        [JsonPropertyName("badge")]
        public string Badge { get; set; } = "24/7";
    }

    public class AirportTransferDto
    {
        [JsonPropertyName("transferId")]
        public string TransferId { get; set; } = string.Empty;

        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("bookingReference")]
        public string BookingReference { get; set; } = string.Empty;

        [JsonPropertyName("guestName")]
        public string GuestName { get; set; } = string.Empty;

        [JsonPropertyName("flight")]
        public FlightDetailsDto Flight { get; set; } = new();

        [JsonPropertyName("arrivalAirportName")]
        public string ArrivalAirportName { get; set; } = string.Empty;

        [JsonPropertyName("pickupMeetingPoint")]
        public string PickupMeetingPoint { get; set; } = string.Empty;

        [JsonPropertyName("digitalPagingBoardText")]
        public string DigitalPagingBoardText { get; set; } = string.Empty;

        [JsonPropertyName("chauffeurName")]
        public string ChauffeurName { get; set; } = string.Empty;

        [JsonPropertyName("chauffeurPhone")]
        public string ChauffeurPhone { get; set; } = string.Empty;

        [JsonPropertyName("chauffeurAvatar")]
        public string ChauffeurAvatar { get; set; } = string.Empty;

        [JsonPropertyName("chauffeurRating")]
        public double ChauffeurRating { get; set; } = 4.9;

        [JsonPropertyName("vehicleModel")]
        public string VehicleModel { get; set; } = string.Empty;

        [JsonPropertyName("vehiclePlateNumber")]
        public string VehiclePlateNumber { get; set; } = string.Empty;

        [JsonPropertyName("vehicleType")]
        public string VehicleType { get; set; } = "Private Premium";

        [JsonPropertyName("transferStatus")]
        public string TransferStatus { get; set; } = "Chauffeur Waiting at Gate"; // "Assigned", "Chauffeur Waiting at Gate", "Boarded & En Route", "Completed"

        [JsonPropertyName("waitingBay")]
        public string WaitingBay { get; set; } = "Bay 4";

        [JsonPropertyName("amenities")]
        public List<TerminalAmenityDto> Amenities { get; set; } = new();

        [JsonPropertyName("emergencyTransferHotline")]
        public string EmergencyTransferHotline { get; set; } = string.Empty;
    }

    public class UpdateChauffeurStatusDto
    {
        [JsonPropertyName("transferId")]
        public string? TransferId { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }
}
