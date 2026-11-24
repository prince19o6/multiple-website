using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class RestaurantRepository : IRestaurantRepository
{
    private readonly IMongoCollection<Restaurant> _restaurants;
    private static readonly ConcurrentDictionary<string, List<Restaurant>> _diskCatalogCache = new(StringComparer.OrdinalIgnoreCase);

    public RestaurantRepository(IMongoDatabase database)
    {
        _restaurants = database.GetCollection<Restaurant>("restaurants");
    }

    private string GetDatabaseName() =>
        _restaurants.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";

    private string GetWebsiteId()
    {
        var dbName = GetDatabaseName();
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private static readonly List<Restaurant> ResilientRestaurants = new()
    {
        new Restaurant
        {
            Id = "rst-queen-spice-bali",
            RestaurantId = "rst-queen-spice-bali",
            RestaurantNumericId = 9001,
            WebsiteId = "gujjutours",
            Title = "Queen's Tandoor Indian Restaurant",
            Name = "Queen's Tandoor Indian Restaurant",
            Slug = "queens-tandoor-indian-pure-veg-bali",
            Cuisine = "indian",
            CuisineLabel = "North & South Indian, Jain",
            City = "Bali",
            Country = "Indonesia",
            Address = "Jl. Raya Seminyak No.1/73, Seminyak, Kuta, Kabupaten Badung, Bali 80361",
            PriceRange = "$$",
            CostForTwo = 1900,
            Currency = "INR",
            Rating = 4.7,
            Reviews = 760,
            Featured = true,
            Popular = true,
            IsPureVeg = true,
            IsJainAvailable = true,
            IsVeganFriendly = true,
            Timings = "11:30 AM - 11:00 PM",
            Image = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85",
            Images = new List<string>
            {
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85",
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85",
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=85"
            },
            DietaryTags = new List<string> { "Pure Vegetarian", "Jain Food Menu", "Seminyak & Kuta", "Indian Chefs", "Live Tandoor" },
            Specialties = new List<string> { "Dal Makhani Queen's Special", "Paneer Tikka Angaar", "Butter Garlic Naan", "Jain Thali Delight" },
            Overview = "Queen's Tandoor is Bali's landmark Indian dining destination in Seminyak, celebrated for authentic North and South Indian culinary mastery, dedicated 100% pure veg and Jain preparations, and warm hospitality for international travellers.",
            Status = "Active"
        },
        new Restaurant
        {
            Id = "rst-maharaja-pure-veg",
            RestaurantId = "rst-maharaja-pure-veg",
            RestaurantNumericId = 9002,
            WebsiteId = "gujjutours",
            Title = "Maharaja Bhog - Premium Gujarati Thali",
            Name = "Maharaja Bhog - Premium Gujarati Thali",
            Slug = "maharaja-bogh-premium-gujarati-thali-dubai",
            Cuisine = "gujarati",
            CuisineLabel = "Authentic Gujarati & Rajasthani",
            City = "Dubai",
            Country = "United Arab Emirates",
            Address = "Ground Floor, Hamsah Building, Ansar Gallery, Al Karama, Dubai",
            PriceRange = "$$",
            CostForTwo = 2050,
            Currency = "INR",
            Rating = 4.9,
            Reviews = 1450,
            Featured = true,
            Popular = true,
            IsPureVeg = true,
            IsJainAvailable = true,
            IsVeganFriendly = true,
            Timings = "12:00 PM - 03:30 PM, 07:00 PM - 11:30 PM",
            Image = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
            Images = new List<string>
            {
                "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
                "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=85",
                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=85"
            },
            DietaryTags = new List<string> { "100% Pure Veg", "Strictly Jain Food", "Unlimited Royal Thali", "Bronze Cutlery" },
            Specialties = new List<string> { "Unlimited Maharaja Thali", "Dal Baati Churma", "Gujarati Kadi & Khichdi", "Shrikhand & Malpua" },
            Overview = "Maharaja Bhog serves an authentic royal vegetarian feast in Dubai. Featuring 30+ items on a traditional bronze platter, unlimited servings, and strict Jain meal preparation.",
            Status = "Active"
        },
        new Restaurant
        {
            Id = "rst-rasoi-ghar",
            RestaurantId = "rst-rasoi-ghar",
            RestaurantNumericId = 9003,
            WebsiteId = "gujjutours",
            Title = "Rasoi Ghar Pure Vegetarian",
            Name = "Rasoi Ghar Pure Vegetarian",
            Slug = "rasoi-ghar-pure-vegetarian-restaurant-dubai",
            Cuisine = "gujarati",
            CuisineLabel = "Gujarati & North Indian Thali",
            City = "Dubai",
            Country = "United Arab Emirates",
            Address = "Zainal Mohebi Plaza, Opposite Centerpoint, Karama, Dubai",
            PriceRange = "$$",
            CostForTwo = 1950,
            Currency = "INR",
            Rating = 4.8,
            Reviews = 1120,
            Featured = true,
            Popular = true,
            IsPureVeg = true,
            IsJainAvailable = true,
            IsVeganFriendly = true,
            Timings = "12:00 PM - 03:30 PM, 07:00 PM - 11:30 PM",
            Image = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=85",
            Images = new List<string>
            {
                "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=85",
                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=85"
            },
            DietaryTags = new List<string> { "Jain Friendly", "100% Pure Veg", "No Onion No Garlic Menu", "Family Dining" },
            Specialties = new List<string> { "Daily Special Grand Thali", "Paneer Makhani", "Smoked Chaas", "Jalebi with Rabdi" },
            Overview = "Rasoi Ghar in Karama is acclaimed for its welcoming ambiance and 100% pure vegetarian Rajasthani and Gujarati delicacies, with attentive table-side service and dedicated Jain chefs.",
            Status = "Active"
        },
        new Restaurant
        {
            Id = "rst-shiv-sagar-dubai",
            RestaurantId = "rst-shiv-sagar-dubai",
            RestaurantNumericId = 9004,
            WebsiteId = "gujjutours",
            Title = "Shiv Sagar Pure Veg & Chaat",
            Name = "Shiv Sagar Pure Veg & Chaat",
            Slug = "shiv-sagar-street-food-pure-veg-dubai",
            Cuisine = "indian",
            CuisineLabel = "Mumbai Street Food & South Indian",
            City = "Dubai",
            Country = "United Arab Emirates",
            Address = "Shop 4, Meena Bazaar, Bur Dubai, Dubai",
            PriceRange = "$",
            CostForTwo = 1350,
            Currency = "INR",
            Rating = 4.8,
            Reviews = 890,
            Featured = true,
            Popular = true,
            IsPureVeg = true,
            IsJainAvailable = true,
            IsVeganFriendly = true,
            Timings = "09:00 AM - 11:30 PM",
            Image = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=85",
            Images = new List<string>
            {
                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=85",
                "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85"
            },
            DietaryTags = new List<string> { "Pure Veg", "Mumbai Chaat", "Jain Pav Bhaji", "Quick Bites" },
            Specialties = new List<string> { "Butter Pav Bhaji (Jain Available)", "Pani Puri & Sev Puri", "Mysore Masala Dosa", "Gulab Jamun with Ice Cream" },
            Overview = "Shiv Sagar brings Mumbai's iconic street food and comforting South Indian tiffin items right to Bur Dubai, offering pure ghee pav bhaji, crisp dosas, and Jain-friendly street chaats.",
            Status = "Active"
        }
    };

    private List<Restaurant> GetDiskCatalog()
    {
        var siteId = GetWebsiteId();

        return _diskCatalogCache.GetOrAdd(siteId, key =>
        {
            var fileName = "restaurants.json";
            var filePath = ToursApi.Common.SeedPathHelper.FindSeedFile(key, fileName)
                           ?? ToursApi.Common.SeedPathHelper.FindSeedFile("gujjutours", fileName);

            if (filePath != null && File.Exists(filePath))
            {
                try
                {
                    var json = File.ReadAllText(filePath);
                    if (json.StartsWith("\uFEFF")) json = json.Substring(1);
                    var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<Restaurant>>(json, opts);
                    if (list != null && list.Count > 0)
                    {
                        // Ensure resilient items are present
                        foreach (var resilient in ResilientRestaurants)
                        {
                            if (!list.Any(r => string.Equals(r.Slug, resilient.Slug, StringComparison.OrdinalIgnoreCase)))
                            {
                                list.Insert(0, resilient);
                            }
                        }
                        return list;
                    }
                }
                catch
                {
                }
            }

            return new List<Restaurant>(ResilientRestaurants);
        });
    }

    public async Task<RestaurantPagedResult> GetRestaurantsAsync(RestaurantFilterParams filters)
    {
        try
        {
            var builder = Builders<Restaurant>.Filter;
            var filter = builder.Eq(r => r.Status, "Active");

            if (!string.IsNullOrWhiteSpace(filters.Query))
            {
                var q = filters.Query.Trim();
                var regex = new BsonRegularExpression(q, "i");
                filter = filter & (
                    builder.Regex(r => r.Title, regex) |
                    builder.Regex(r => r.City, regex) |
                    builder.Regex(r => r.Address, regex) |
                    builder.Regex(r => r.CuisineLabel, regex)
                );
            }

            if (!string.IsNullOrWhiteSpace(filters.City) && !filters.City.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var cityRegex = new BsonRegularExpression(filters.City.Trim(), "i");
                filter = filter & (builder.Regex(r => r.City, cityRegex) | builder.Regex(r => r.Country, cityRegex));
            }

            if (!string.IsNullOrWhiteSpace(filters.Cuisine) && !filters.Cuisine.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var c = filters.Cuisine.Trim().ToLowerInvariant();
                filter = filter & (builder.Eq(r => r.Cuisine, c) | builder.Regex(r => r.CuisineLabel, new BsonRegularExpression(c, "i")));
            }

            if (filters.PureVegOnly == true)
            {
                filter = filter & builder.Eq(r => r.IsPureVeg, true);
            }

            if (filters.JainOnly == true)
            {
                filter = filter & builder.Eq(r => r.IsJainAvailable, true);
            }

            if (filters.HalalOnly == true)
            {
                filter = filter & builder.Eq(r => r.IsHalalCertified, true);
            }

            if (!string.IsNullOrWhiteSpace(filters.PriceRange) && !filters.PriceRange.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                filter = filter & builder.Eq(r => r.PriceRange, filters.PriceRange.Trim());
            }

            if (filters.MinCost.HasValue && filters.MinCost > 0)
            {
                filter = filter & builder.Gte(r => r.CostForTwo, filters.MinCost.Value);
            }

            if (filters.MaxCost.HasValue && filters.MaxCost > 0)
            {
                filter = filter & builder.Lte(r => r.CostForTwo, filters.MaxCost.Value);
            }

            var total = await _restaurants.CountDocumentsAsync(filter);

            if (total > 0)
            {
                var query = _restaurants.Find(filter);

                switch (filters.Sort?.ToLowerInvariant())
                {
                    case "cost_asc":
                    case "price_asc":
                        query = query.SortBy(r => r.CostForTwo);
                        break;
                    case "cost_desc":
                    case "price_desc":
                        query = query.SortByDescending(r => r.CostForTwo);
                        break;
                    case "rating_desc":
                        query = query.SortByDescending(r => r.Rating).ThenByDescending(r => r.Reviews);
                        break;
                    case "newest":
                        query = query.SortByDescending(r => r.IsNew).ThenByDescending(r => r.CreatedAt);
                        break;
                    case "popular":
                    default:
                        query = query.SortByDescending(r => r.Featured).ThenByDescending(r => r.Popular).ThenByDescending(r => r.Rating);
                        break;
                }

                var page = filters.Page < 1 ? 1 : filters.Page;
                var pageSize = filters.PageSize < 1 ? 20 : filters.PageSize;

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Limit(pageSize)
                    .ToListAsync();

                return new RestaurantPagedResult
                {
                    Items = items,
                    Total = total,
                    Page = page,
                    PageSize = pageSize
                };
            }
        }
        catch
        {
            // Fall back to seed
        }

        var allSeed = GetDiskCatalog();
        var qSeed = allSeed.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filters.Query))
        {
            var q = filters.Query.Trim().ToLowerInvariant();
            qSeed = qSeed.Where(r =>
                (r.Title != null && r.Title.ToLower().Contains(q)) ||
                (r.City != null && r.City.ToLower().Contains(q)) ||
                (r.Address != null && r.Address.ToLower().Contains(q)) ||
                (r.CuisineLabel != null && r.CuisineLabel.ToLower().Contains(q)));
        }

        if (!string.IsNullOrWhiteSpace(filters.City) && !filters.City.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var city = filters.City.Trim().ToLowerInvariant();
            qSeed = qSeed.Where(r => (r.City != null && r.City.ToLower().Contains(city)) || (r.Country != null && r.Country.ToLower().Contains(city)));
        }

        if (!string.IsNullOrWhiteSpace(filters.Cuisine) && !filters.Cuisine.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var c = filters.Cuisine.Trim().ToLowerInvariant();
            qSeed = qSeed.Where(r => (r.Cuisine != null && r.Cuisine.ToLower() == c) || (r.CuisineLabel != null && r.CuisineLabel.ToLower().Contains(c)));
        }

        if (filters.PureVegOnly == true)
        {
            qSeed = qSeed.Where(r => r.IsPureVeg);
        }

        if (filters.JainOnly == true)
        {
            qSeed = qSeed.Where(r => r.IsJainAvailable);
        }

        if (filters.MinCost.HasValue && filters.MinCost > 0)
        {
            qSeed = qSeed.Where(r => r.CostForTwo >= filters.MinCost.Value);
        }

        if (filters.MaxCost.HasValue && filters.MaxCost > 0)
        {
            qSeed = qSeed.Where(r => r.CostForTwo <= filters.MaxCost.Value);
        }

        switch (filters.Sort?.ToLowerInvariant())
        {
            case "cost_asc":
            case "price_asc":
                qSeed = qSeed.OrderBy(r => r.CostForTwo);
                break;
            case "cost_desc":
            case "price_desc":
                qSeed = qSeed.OrderByDescending(r => r.CostForTwo);
                break;
            case "rating_desc":
                qSeed = qSeed.OrderByDescending(r => r.Rating).ThenByDescending(r => r.Reviews);
                break;
            default:
                qSeed = qSeed.OrderByDescending(r => r.Featured).ThenByDescending(r => r.Popular).ThenByDescending(r => r.Rating);
                break;
        }

        var p = filters.Page < 1 ? 1 : filters.Page;
        var ps = filters.PageSize < 1 ? 20 : filters.PageSize;
        var list = qSeed.ToList();

        return new RestaurantPagedResult
        {
            Items = list.Skip((p - 1) * ps).Take(ps).ToList(),
            Total = list.Count,
            Page = p,
            PageSize = ps
        };
    }

    public async Task<Restaurant?> GetRestaurantBySlugAsync(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug)) return null;
        var clean = slug.Trim().ToLowerInvariant();
        try
        {
            var regex = new BsonRegularExpression($"^{clean}$", "i");
            var filter = Builders<Restaurant>.Filter.Regex(r => r.Slug, regex);
            var r = await _restaurants.Find(filter).FirstOrDefaultAsync();
            if (r != null) return r;
        }
        catch
        {
        }

        return GetDiskCatalog().FirstOrDefault(r =>
            string.Equals(r.Slug, clean, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r.RestaurantId, clean, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r.Id, clean, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<Restaurant?> GetRestaurantByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return null;
        var clean = id.Trim();

        try
        {
            var builder = Builders<Restaurant>.Filter;
            FilterDefinition<Restaurant> filter = builder.Eq(r => r.RestaurantId, clean) |
                                                  builder.Regex(r => r.RestaurantId, new BsonRegularExpression($"^{clean}$", "i"));

            if (int.TryParse(clean, out var numId))
            {
                filter = filter | builder.Eq(r => r.RestaurantNumericId, numId);
            }

            if (ObjectId.TryParse(clean, out _))
            {
                filter = filter | builder.Eq(r => r.Id, clean);
            }

            var r = await _restaurants.Find(filter).FirstOrDefaultAsync();
            if (r != null) return r;
        }
        catch
        {
        }

        int.TryParse(clean, out var parsedNum);
        return GetDiskCatalog().FirstOrDefault(r =>
            string.Equals(r.RestaurantId, clean, StringComparison.OrdinalIgnoreCase) ||
            (parsedNum > 0 && r.RestaurantNumericId == parsedNum) ||
            string.Equals(r.Id, clean, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r.Slug, clean, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<List<string>> AutocompleteCitiesAsync(string query, int limit = 8)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                var cities = await _restaurants.Distinct<string>("City", Builders<Restaurant>.Filter.Empty).ToListAsync();
                if (cities != null && cities.Count > 0) return cities.Take(limit).ToList();
            }
            else
            {
                var regex = new BsonRegularExpression(query.Trim(), "i");
                var filter = Builders<Restaurant>.Filter.Regex(r => r.City, regex);
                var matches = await _restaurants.Distinct<string>("City", filter).ToListAsync();
                if (matches != null && matches.Count > 0) return matches.Take(limit).ToList();
            }
        }
        catch
        {
        }

        var seedCities = GetDiskCatalog()
            .Select(r => r.City)
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim().ToLowerInvariant();
            seedCities = seedCities.Where(c => c.ToLower().Contains(q));
        }

        return seedCities.Take(limit).ToList();
    }

    public async Task<List<string>> AutocompleteNamesAsync(string query, int limit = 8)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                var names = await _restaurants.Distinct<string>("Title", Builders<Restaurant>.Filter.Empty).ToListAsync();
                if (names != null && names.Count > 0) return names.Take(limit).ToList();
            }
            else
            {
                var regex = new BsonRegularExpression(query.Trim(), "i");
                var filter = Builders<Restaurant>.Filter.Regex(r => r.Title, regex);
                var matches = await _restaurants.Distinct<string>("Title", filter).ToListAsync();
                if (matches != null && matches.Count > 0) return matches.Take(limit).ToList();
            }
        }
        catch
        {
        }

        var seedNames = GetDiskCatalog()
            .Select(r => r.Title)
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Distinct(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim().ToLowerInvariant();
            seedNames = seedNames.Where(n => n.ToLower().Contains(q));
        }

        return seedNames.Take(limit).ToList();
    }

    public async Task CreateRestaurantAsync(Restaurant restaurant)
    {
        if (string.IsNullOrEmpty(restaurant.Id))
        {
            restaurant.Id = ObjectId.GenerateNewId().ToString();
        }
        try
        {
            await _restaurants.InsertOneAsync(restaurant);
        }
        catch
        {
        }
    }

    public async Task<bool> UpdateRestaurantAsync(string id, Restaurant restaurant)
    {
        try
        {
            var filter = Builders<Restaurant>.Filter.Eq(r => r.Id, id);
            var result = await _restaurants.ReplaceOneAsync(filter, restaurant);
            return result.ModifiedCount > 0;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeleteRestaurantAsync(string id)
    {
        try
        {
            var filter = Builders<Restaurant>.Filter.Eq(r => r.Id, id);
            var result = await _restaurants.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }
        catch
        {
            return false;
        }
    }
}
