using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/weather")]
    public class WeatherController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;

        public WeatherController(IWebsiteContext websiteContext)
        {
            _websiteContext = websiteContext;
        }

        [HttpGet("current")]
        public IActionResult GetCurrentWeather([FromQuery] string? destinationId)
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var destinations = BuildBrandWeather(siteId);

            DestinationWeatherDto selected;
            if (!string.IsNullOrWhiteSpace(destinationId))
            {
                selected = destinations.FirstOrDefault(d => d.DestinationId.Equals(destinationId, StringComparison.OrdinalIgnoreCase)) ?? destinations[0];
            }
            else
            {
                selected = destinations[0];
            }

            return Ok(new
            {
                success = true,
                siteId,
                data = selected
            });
        }

        [HttpGet("destinations")]
        public IActionResult GetAllDestinationsWeather()
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var destinations = BuildBrandWeather(siteId);

            return Ok(new
            {
                success = true,
                siteId,
                totalCount = destinations.Count,
                data = destinations
            });
        }

        private List<DestinationWeatherDto> BuildBrandWeather(string siteId)
        {
            var today = DateTime.UtcNow;
            var dayNames = new[] { "Today", "Tomorrow", today.AddDays(2).ToString("ddd"), today.AddDays(3).ToString("ddd"), today.AddDays(4).ToString("ddd"), today.AddDays(5).ToString("ddd"), today.AddDays(6).ToString("ddd") };

            if (siteId.Contains("tripgo"))
            {
                return new List<DestinationWeatherDto>
                {
                    new DestinationWeatherDto
                    {
                        DestinationId = "phiphi",
                        DestinationName = "Koh Phi Phi & Maya Bay",
                        Region = "Krabi Province",
                        Country = "Thailand",
                        TempC = 31,
                        TempF = 88,
                        FeelsLikeC = 34,
                        FeelsLikeF = 93,
                        Condition = "Tropical Sunshine",
                        ConditionIcon = "sunny",
                        HumidityPercent = 76,
                        WindKmh = 14,
                        UvIndex = 10,
                        UvLevel = "Very High",
                        AirQualityIndex = 22,
                        AirQualityStatus = "Excellent",
                        Sunrise = "06:12 AM",
                        Sunset = "06:25 PM",
                        TideStatus = "Calm Waters (Swell 0.4m) • Safe for Speedboats",
                        AdvisoryMessage = "Clear turquoise water visibility up to 18 meters today. Apply reef-safe sunscreen before marine snorkeling.",
                        Hourly = new List<HourlyForecastDto>
                        {
                            new HourlyForecastDto { Time = "08:00", TempC = 28, TempF = 82, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 5 },
                            new HourlyForecastDto { Time = "11:00", TempC = 31, TempF = 88, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 10 },
                            new HourlyForecastDto { Time = "14:00", TempC = 32, TempF = 90, Condition = "Partly Cloudy", Icon = "partly-sunny", RainProbabilityPercent = 15 },
                            new HourlyForecastDto { Time = "17:00", TempC = 29, TempF = 84, Condition = "Golden Hour", Icon = "sunny", RainProbabilityPercent = 10 },
                            new HourlyForecastDto { Time = "20:00", TempC = 27, TempF = 81, Condition = "Breezy", Icon = "cloudy-night", RainProbabilityPercent = 10 },
                        },
                        Daily = new List<DailyForecastDto>
                        {
                            new DailyForecastDto { DayName = dayNames[0], Date = today.ToString("MMM dd"), TempMaxC = 32, TempMinC = 26, TempMaxF = 90, TempMinF = 79, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 10, ActivityFeasibility = "Peak Conditions for Speedboats" },
                            new DailyForecastDto { DayName = dayNames[1], Date = today.AddDays(1).ToString("MMM dd"), TempMaxC = 31, TempMinC = 26, TempMaxF = 88, TempMinF = 79, Condition = "Tropical Sun", Icon = "sunny", RainProbabilityPercent = 15, ActivityFeasibility = "Excellent Snorkel Visibility" },
                            new DailyForecastDto { DayName = dayNames[2], Date = today.AddDays(2).ToString("MMM dd"), TempMaxC = 31, TempMinC = 25, TempMaxF = 88, TempMinF = 77, Condition = "Partly Cloudy", Icon = "partly-sunny", RainProbabilityPercent = 20, ActivityFeasibility = "Great for Lagoon Kayaking" },
                            new DailyForecastDto { DayName = dayNames[3], Date = today.AddDays(3).ToString("MMM dd"), TempMaxC = 30, TempMinC = 25, TempMaxF = 86, TempMinF = 77, Condition = "Isolated Showers", Icon = "rainy", RainProbabilityPercent = 35, ActivityFeasibility = "Good (Morning Best)" },
                            new DailyForecastDto { DayName = dayNames[4], Date = today.AddDays(4).ToString("MMM dd"), TempMaxC = 31, TempMinC = 26, TempMaxF = 88, TempMinF = 79, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 10, ActivityFeasibility = "Ideal for Maya Bay" },
                        }
                    },
                    new DestinationWeatherDto
                    {
                        DestinationId = "bangkok",
                        DestinationName = "Bangkok & Chao Phraya",
                        Region = "Central Thailand",
                        Country = "Thailand",
                        TempC = 33,
                        TempF = 91,
                        FeelsLikeC = 37,
                        FeelsLikeF = 99,
                        Condition = "Warm & Humid",
                        ConditionIcon = "partly-sunny",
                        HumidityPercent = 72,
                        WindKmh = 10,
                        UvIndex = 9,
                        UvLevel = "Very High",
                        AirQualityIndex = 55,
                        AirQualityStatus = "Moderate",
                        Sunrise = "06:08 AM",
                        Sunset = "06:18 PM",
                        TideStatus = "High River Tide at 16:00",
                        AdvisoryMessage = "Light evening rain probability (25%) around 18:30. Ideal morning conditions for Wat Arun and Grand Palace.",
                        Hourly = new List<HourlyForecastDto>
                        {
                            new HourlyForecastDto { Time = "08:00", TempC = 29, TempF = 84, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 5 },
                            new HourlyForecastDto { Time = "11:00", TempC = 33, TempF = 91, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 10 },
                            new HourlyForecastDto { Time = "14:00", TempC = 34, TempF = 93, Condition = "Partly Cloudy", Icon = "partly-sunny", RainProbabilityPercent = 20 },
                            new HourlyForecastDto { Time = "17:00", TempC = 31, TempF = 88, Condition = "Passing Cloud", Icon = "cloudy", RainProbabilityPercent = 25 },
                            new HourlyForecastDto { Time = "20:00", TempC = 29, TempF = 84, Condition = "Warm Night", Icon = "cloudy-night", RainProbabilityPercent = 15 },
                        },
                        Daily = new List<DailyForecastDto>
                        {
                            new DailyForecastDto { DayName = dayNames[0], Date = today.ToString("MMM dd"), TempMaxC = 34, TempMinC = 27, TempMaxF = 93, TempMinF = 81, Condition = "Warm & Clear", Icon = "sunny", RainProbabilityPercent = 15, ActivityFeasibility = "Great for Morning Temples" },
                            new DailyForecastDto { DayName = dayNames[1], Date = today.AddDays(1).ToString("MMM dd"), TempMaxC = 33, TempMinC = 26, TempMaxF = 91, TempMinF = 79, Condition = "Partly Cloudy", Icon = "partly-sunny", RainProbabilityPercent = 20, ActivityFeasibility = "Comfortable River Cruise" },
                            new DailyForecastDto { DayName = dayNames[2], Date = today.AddDays(2).ToString("MMM dd"), TempMaxC = 34, TempMinC = 27, TempMaxF = 93, TempMinF = 81, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 10, ActivityFeasibility = "Ideal for Street Food Tour" },
                        }
                    }
                };
            }

            if (siteId.Contains("techno"))
            {
                return new List<DestinationWeatherDto>
                {
                    new DestinationWeatherDto
                    {
                        DestinationId = "dubai",
                        DestinationName = "Downtown Dubai & Burj Khalifa",
                        Region = "Emirate of Dubai",
                        Country = "United Arab Emirates",
                        TempC = 28,
                        TempF = 82,
                        FeelsLikeC = 29,
                        FeelsLikeF = 84,
                        Condition = "Clear Desert Sky",
                        ConditionIcon = "sunny",
                        HumidityPercent = 48,
                        WindKmh = 16,
                        UvIndex = 7,
                        UvLevel = "High",
                        AirQualityIndex = 48,
                        AirQualityStatus = "Good",
                        Sunrise = "06:25 AM",
                        Sunset = "05:52 PM",
                        TideStatus = "Gulf Waters Calm • Swell 0.2m",
                        AdvisoryMessage = "Crystal clear visibility across the skyline. Burj Khalifa At the Top observation decks will enjoy unobstructed views of the Palm and desert horizon.",
                        Hourly = new List<HourlyForecastDto>
                        {
                            new HourlyForecastDto { Time = "08:00", TempC = 24, TempF = 75, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 0 },
                            new HourlyForecastDto { Time = "11:00", TempC = 28, TempF = 82, Condition = "Clear", Icon = "sunny", RainProbabilityPercent = 0 },
                            new HourlyForecastDto { Time = "14:00", TempC = 29, TempF = 84, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 0 },
                            new HourlyForecastDto { Time = "17:00", TempC = 26, TempF = 79, Condition = "Golden Sunset", Icon = "sunny", RainProbabilityPercent = 0 },
                            new HourlyForecastDto { Time = "20:00", TempC = 23, TempF = 73, Condition = "Clear Night", Icon = "moon", RainProbabilityPercent = 0 },
                        },
                        Daily = new List<DailyForecastDto>
                        {
                            new DailyForecastDto { DayName = dayNames[0], Date = today.ToString("MMM dd"), TempMaxC = 29, TempMinC = 21, TempMaxF = 84, TempMinF = 70, Condition = "Clear Sky", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Optimal Skyline Observation" },
                            new DailyForecastDto { DayName = dayNames[1], Date = today.AddDays(1).ToString("MMM dd"), TempMaxC = 28, TempMinC = 20, TempMaxF = 82, TempMinF = 68, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Perfect for Dubai Marina Yacht" },
                            new DailyForecastDto { DayName = dayNames[2], Date = today.AddDays(2).ToString("MMM dd"), TempMaxC = 29, TempMinC = 21, TempMaxF = 84, TempMinF = 70, Condition = "Pleasant", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Ideal for Palm Jumeirah Walk" },
                        }
                    },
                    new DestinationWeatherDto
                    {
                        DestinationId = "desert",
                        DestinationName = "Lahbab Red Dunes Desert Reserve",
                        Region = "Dubai Desert Conservation",
                        Country = "United Arab Emirates",
                        TempC = 32,
                        TempF = 90,
                        FeelsLikeC = 31,
                        FeelsLikeF = 88,
                        Condition = "Sunny & Crisp",
                        ConditionIcon = "sunny",
                        HumidityPercent = 32,
                        WindKmh = 14,
                        UvIndex = 8,
                        UvLevel = "Very High",
                        AirQualityIndex = 40,
                        AirQualityStatus = "Good",
                        Sunrise = "06:24 AM",
                        Sunset = "05:50 PM",
                        TideStatus = "Inland Desert Terrain",
                        AdvisoryMessage = "Evening safari departures (15:00 onwards) capture golden hour sunset over red dunes. Light jacket recommended after 20:00 as sand cools down.",
                        Hourly = new List<HourlyForecastDto>
                        {
                            new HourlyForecastDto { Time = "12:00", TempC = 32, TempF = 90, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 0 },
                            new HourlyForecastDto { Time = "15:00", TempC = 31, TempF = 88, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 0 },
                            new HourlyForecastDto { Time = "18:00", TempC = 26, TempF = 79, Condition = "Sunset", Icon = "sunny", RainProbabilityPercent = 0 },
                            new HourlyForecastDto { Time = "21:00", TempC = 22, TempF = 72, Condition = "Starlit Sky", Icon = "moon", RainProbabilityPercent = 0 },
                        },
                        Daily = new List<DailyForecastDto>
                        {
                            new DailyForecastDto { DayName = dayNames[0], Date = today.ToString("MMM dd"), TempMaxC = 32, TempMinC = 19, TempMaxF = 90, TempMinF = 66, Condition = "Crisp Desert", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Peak Sunset Dune Bashing" },
                            new DailyForecastDto { DayName = dayNames[1], Date = today.AddDays(1).ToString("MMM dd"), TempMaxC = 31, TempMinC = 18, TempMaxF = 88, TempMinF = 64, Condition = "Clear Starlight", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Ideal for Bedouin Camp" },
                        }
                    }
                };
            }

            // Default: GujjuTours
            return new List<DestinationWeatherDto>
            {
                new DestinationWeatherDto
                {
                    DestinationId = "dwarka",
                    DestinationName = "Dwarka & Gomti Ghat Coast",
                    Region = "Devbhumi Dwarka, Saurashtra",
                    Country = "India",
                    TempC = 29,
                    TempF = 84,
                    FeelsLikeC = 31,
                    FeelsLikeF = 88,
                    Condition = "Breezy & Sunny",
                    ConditionIcon = "sunny",
                    HumidityPercent = 62,
                    WindKmh = 22,
                    UvIndex = 7,
                    UvLevel = "High",
                    AirQualityIndex = 42,
                    AirQualityStatus = "Good",
                    Sunrise = "06:42 AM",
                    Sunset = "06:34 PM",
                    TideStatus = "Low Tide at 14:30 • Ideal for Gomti Ghat Holy Dip",
                    AdvisoryMessage = "Pleasant coastal sea breeze in the evening. Temple flag changing ceremony at 17:00 will experience clear skies with calm coastal winds.",
                    Hourly = new List<HourlyForecastDto>
                    {
                        new HourlyForecastDto { Time = "06:00", TempC = 24, TempF = 75, Condition = "Morning Breeze", Icon = "sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "09:00", TempC = 27, TempF = 81, Condition = "Pleasant", Icon = "sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "12:00", TempC = 29, TempF = 84, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "15:00", TempC = 30, TempF = 86, Condition = "Sea Breeze", Icon = "partly-sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "18:00", TempC = 27, TempF = 81, Condition = "Sunset Aarti", Icon = "sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "21:00", TempC = 25, TempF = 77, Condition = "Cool Evening", Icon = "moon", RainProbabilityPercent = 0 },
                    },
                    Daily = new List<DailyForecastDto>
                    {
                        new DailyForecastDto { DayName = dayNames[0], Date = today.ToString("MMM dd"), TempMaxC = 30, TempMinC = 23, TempMaxF = 86, TempMinF = 73, Condition = "Breezy & Clear", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Peak Darshan Conditions" },
                        new DailyForecastDto { DayName = dayNames[1], Date = today.AddDays(1).ToString("MMM dd"), TempMaxC = 29, TempMinC = 22, TempMaxF = 84, TempMinF = 72, Condition = "Sunny Coast", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Ideal for Bet Dwarka Boat Tour" },
                        new DailyForecastDto { DayName = dayNames[2], Date = today.AddDays(2).ToString("MMM dd"), TempMaxC = 29, TempMinC = 22, TempMaxF = 84, TempMinF = 72, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Comfortable Pilgrimage Walk" },
                        new DailyForecastDto { DayName = dayNames[3], Date = today.AddDays(3).ToString("MMM dd"), TempMaxC = 30, TempMinC = 23, TempMaxF = 86, TempMinF = 73, Condition = "Clear", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Ideal for Gomti Ghat Sunset" },
                    }
                },
                new DestinationWeatherDto
                {
                    DestinationId = "somnath",
                    DestinationName = "Somnath & Prabhas Patan",
                    Region = "Gir Somnath, Saurashtra",
                    Country = "India",
                    TempC = 28,
                    TempF = 82,
                    FeelsLikeC = 30,
                    FeelsLikeF = 86,
                    Condition = "Clear Arabian Sea Skies",
                    ConditionIcon = "sunny",
                    HumidityPercent = 68,
                    WindKmh = 19,
                    UvIndex = 6,
                    UvLevel = "Moderate",
                    AirQualityIndex = 38,
                    AirQualityStatus = "Good",
                    Sunrise = "06:38 AM",
                    Sunset = "06:29 PM",
                    TideStatus = "High Tide at 18:00 • Spectacular Waves at Temple Promenade",
                    AdvisoryMessage = "Carry sunglasses and socks for walking on the afternoon temple marble courtyard. The evening Sound & Light show at 20:00 will have cool ocean breezes.",
                    Hourly = new List<HourlyForecastDto>
                    {
                        new HourlyForecastDto { Time = "06:00", TempC = 23, TempF = 73, Condition = "Dawn Darshan", Icon = "sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "10:00", TempC = 27, TempF = 81, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "14:00", TempC = 29, TempF = 84, Condition = "Warm Courtyard", Icon = "sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "18:00", TempC = 26, TempF = 79, Condition = "Ocean Waves", Icon = "sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "21:00", TempC = 24, TempF = 75, Condition = "Starlit Aarti", Icon = "moon", RainProbabilityPercent = 0 },
                    },
                    Daily = new List<DailyForecastDto>
                    {
                        new DailyForecastDto { DayName = dayNames[0], Date = today.ToString("MMM dd"), TempMaxC = 29, TempMinC = 22, TempMaxF = 84, TempMinF = 72, Condition = "Clear Skies", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Excellent for Evening Aarti" },
                        new DailyForecastDto { DayName = dayNames[1], Date = today.AddDays(1).ToString("MMM dd"), TempMaxC = 28, TempMinC = 21, TempMaxF = 82, TempMinF = 70, Condition = "Ocean Breeze", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Ideal for Triveni Sangam" },
                    }
                },
                new DestinationWeatherDto
                {
                    DestinationId = "gir",
                    DestinationName = "Sasan Gir National Park",
                    Region = "Junagadh / Amreli, Gujarat",
                    Country = "India",
                    TempC = 31,
                    TempF = 88,
                    FeelsLikeC = 32,
                    FeelsLikeF = 90,
                    Condition = "Warm & Dry Forest",
                    ConditionIcon = "partly-sunny",
                    HumidityPercent = 45,
                    WindKmh = 12,
                    UvIndex = 8,
                    UvLevel = "Very High",
                    AirQualityIndex = 35,
                    AirQualityStatus = "Good",
                    Sunrise = "06:35 AM",
                    Sunset = "06:28 PM",
                    TideStatus = "Inland Wildlife Reserve",
                    AdvisoryMessage = "Early morning safari (06:00 - 09:00) offers the coolest weather and peak lion movement around water holes. Wear neutral earthy colors.",
                    Hourly = new List<HourlyForecastDto>
                    {
                        new HourlyForecastDto { Time = "06:00", TempC = 21, TempF = 70, Condition = "Crisp Forest", Icon = "partly-sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "09:00", TempC = 26, TempF = 79, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "13:00", TempC = 32, TempF = 90, Condition = "Dry Heat", Icon = "sunny", RainProbabilityPercent = 0 },
                        new HourlyForecastDto { Time = "17:00", TempC = 28, TempF = 82, Condition = "Golden Safari", Icon = "sunny", RainProbabilityPercent = 0 },
                    },
                    Daily = new List<DailyForecastDto>
                    {
                        new DailyForecastDto { DayName = dayNames[0], Date = today.ToString("MMM dd"), TempMaxC = 32, TempMinC = 19, TempMaxF = 90, TempMinF = 66, Condition = "Dry Forest", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Peak Lion Safari Sighting" },
                        new DailyForecastDto { DayName = dayNames[1], Date = today.AddDays(1).ToString("MMM dd"), TempMaxC = 31, TempMinC = 18, TempMaxF = 88, TempMinF = 64, Condition = "Sunny", Icon = "sunny", RainProbabilityPercent = 0, ActivityFeasibility = "Great Jungle Visibility" },
                    }
                }
            };
        }
    }
}
