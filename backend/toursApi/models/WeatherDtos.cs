using System.Collections.Generic;

namespace ToursApi.Models
{
    public class HourlyForecastDto
    {
        public string Time { get; set; } = string.Empty;
        public int TempC { get; set; }
        public int TempF { get; set; }
        public string Condition { get; set; } = "Sunny";
        public string Icon { get; set; } = "sunny";
        public int RainProbabilityPercent { get; set; }
    }

    public class DailyForecastDto
    {
        public string DayName { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public int TempMaxC { get; set; }
        public int TempMinC { get; set; }
        public int TempMaxF { get; set; }
        public int TempMinF { get; set; }
        public string Condition { get; set; } = "Sunny";
        public string Icon { get; set; } = "sunny";
        public int RainProbabilityPercent { get; set; }
        public string ActivityFeasibility { get; set; } = "Ideal for Tours";
    }

    public class DestinationWeatherDto
    {
        public string DestinationId { get; set; } = string.Empty;
        public string DestinationName { get; set; } = string.Empty;
        public string Region { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public int TempC { get; set; }
        public int TempF { get; set; }
        public int FeelsLikeC { get; set; }
        public int FeelsLikeF { get; set; }
        public string Condition { get; set; } = "Sunny";
        public string ConditionIcon { get; set; } = "sunny";
        public int HumidityPercent { get; set; }
        public int WindKmh { get; set; }
        public int UvIndex { get; set; }
        public string UvLevel { get; set; } = "Moderate"; // Low, Moderate, High, Very High, Extreme
        public int AirQualityIndex { get; set; }
        public string AirQualityStatus { get; set; } = "Good";
        public string Sunrise { get; set; } = "06:30 AM";
        public string Sunset { get; set; } = "06:45 PM";
        public string TideStatus { get; set; } = "Calm Waters";
        public string AdvisoryMessage { get; set; } = string.Empty;
        public List<HourlyForecastDto> Hourly { get; set; } = new List<HourlyForecastDto>();
        public List<DailyForecastDto> Daily { get; set; } = new List<DailyForecastDto>();
    }
}
