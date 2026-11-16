using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class FlightAirport
{
    [BsonElement("code")]
    public string Code { get; set; } = string.Empty;

    [BsonElement("city")]
    public string City { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("country")]
    public string Country { get; set; } = string.Empty;

    [BsonElement("terminal")]
    public string Terminal { get; set; } = "T1";
}

[BsonIgnoreExtraElements]
public class FlightBaggage
{
    [BsonElement("cabin")]
    public string Cabin { get; set; } = "7 kg";

    [BsonElement("checkIn")]
    public string CheckIn { get; set; } = "15 kg";
}

[BsonIgnoreExtraElements]
public class FlightMeals
{
    [BsonElement("included")]
    public bool Included { get; set; } = true;

    [BsonElement("pureVegGuaranteed")]
    public bool PureVegGuaranteed { get; set; } = false;

    [BsonElement("jainMealAvailable")]
    public bool JainMealAvailable { get; set; } = false;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class Flight
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int FlightNumericId { get; set; }

    [BsonElement("flightId")]
    public string? FlightId { get; set; }

    [BsonElement("websiteId")]
    public string WebsiteId { get; set; } = "gujjutours";

    [BsonElement("website")]
    public string? Website { get; set; }

    [BsonElement("airline")]
    public string Airline { get; set; } = string.Empty;

    [BsonElement("airlineCode")]
    public string AirlineCode { get; set; } = string.Empty;

    [BsonElement("flightNumber")]
    public string FlightNumber { get; set; } = string.Empty;

    [BsonElement("airlineLogo")]
    public string AirlineLogo { get; set; } = "/seed-images/flights/airline-skywings.svg";

    [BsonElement("fromAirport")]
    public FlightAirport FromAirport { get; set; } = new();

    [BsonElement("toAirport")]
    public FlightAirport ToAirport { get; set; } = new();

    [BsonElement("departureTime")]
    public string DepartureTime { get; set; } = "06:00";

    [BsonElement("arrivalTime")]
    public string ArrivalTime { get; set; } = "08:15";

    [BsonElement("duration")]
    public string Duration { get; set; } = "2h 15m";

    [BsonElement("durationMinutes")]
    public int DurationMinutes { get; set; } = 135;

    [BsonElement("stops")]
    public string Stops { get; set; } = "Non-stop";

    [BsonElement("stopsCount")]
    public int StopsCount { get; set; } = 0;

    [BsonElement("cabinClass")]
    public string CabinClass { get; set; } = "Economy";

    [BsonElement("price")]
    public double Price { get; set; }

    [BsonElement("originalPrice")]
    public double? OriginalPrice { get; set; }

    [BsonElement("netPrice")]
    public double? NetPrice { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "INR";

    [BsonElement("refundable")]
    public bool Refundable { get; set; } = true;

    [BsonElement("cancellationPolicy")]
    public string CancellationPolicy { get; set; } = "Free cancellation up to 24 hours prior to departure";

    [BsonElement("baggage")]
    public FlightBaggage Baggage { get; set; } = new();

    [BsonElement("meals")]
    public FlightMeals Meals { get; set; } = new();

    [BsonElement("aircraft")]
    public string Aircraft { get; set; } = "Airbus A320neo";

    [BsonElement("routeSlug")]
    public string RouteSlug { get; set; } = string.Empty;

    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("isDomestic")]
    public bool IsDomestic { get; set; } = true;

    [BsonElement("featured")]
    public bool Featured { get; set; }

    [BsonElement("rating")]
    public double Rating { get; set; } = 4.7;

    [BsonElement("reviews")]
    public int Reviews { get; set; } = 150;

    [BsonElement("availableSeats")]
    public int AvailableSeats { get; set; } = 12;

    [BsonElement("status")]
    public string Status { get; set; } = "Active";

    [BsonElement("createdAt")]
    public DateTime? CreatedAt { get; set; }
}

