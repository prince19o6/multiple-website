using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Services;

public class TenantSeedService : ITenantSeedService
{
    private readonly IMongoDatabaseProvider _databaseProvider;
    private readonly ILogger<TenantSeedService> _logger;

    public TenantSeedService(IMongoDatabaseProvider databaseProvider, ILogger<TenantSeedService> logger)
    {
        _databaseProvider = databaseProvider;
        _logger = logger;
    }

    public async Task<Dictionary<string, object>> SeedAllTenantsAsync()
    {
        var results = new Dictionary<string, object>();
        var tenants = new[] { "gujjutours", "tripgoasia", "technoheaven" };

        foreach (var tenant in tenants)
        {
            try
            {
                var dbName = $"tours_{tenant}";
                var db = _databaseProvider.GetDatabase(dbName);
                var seedSummary = await SeedTenantDatabaseAsync(db, tenant);
                results[tenant] = new
                {
                    database = dbName,
                    summary = seedSummary
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to seed tenant '{Tenant}'", tenant);
                results[tenant] = new
                {
                    status = "failed",
                    error = ex.Message
                };
            }
        }

        return results;
    }

    public async Task<Dictionary<string, int>> SeedTenantDatabaseAsync(IMongoDatabase db, string siteId)
    {
        var counts = new Dictionary<string, int>();

        // 1. Tours
        var toursCol = db.GetCollection<Tour>("tours");
        var diskTours = LoadEntitiesFromDisk<Tour>(siteId, $"tours.{siteId}.json");
        if (diskTours.Count == 0) diskTours = GetToursForSite(siteId);
        int toursInserted = 0;
        foreach (var tour in diskTours)
        {
            var filter = Builders<Tour>.Filter.Eq(t => t.Slug, tour.Slug);
            var existing = await toursCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                tour.Website = siteId;
                tour.TenantId = siteId;
                await toursCol.InsertOneAsync(tour);
                toursInserted++;
            }
        }
        counts["tours"] = toursInserted;

        // 2. Destinations
        var destsCol = db.GetCollection<Destination>("destinations");
        var diskDests = GetDestinationsForSite(siteId);
        int destsInserted = 0;
        foreach (var d in diskDests)
        {
            var filter = Builders<Destination>.Filter.Eq(x => x.Name, d.Name);
            var existing = await destsCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                d.Website = siteId;
                await destsCol.InsertOneAsync(d);
                destsInserted++;
            }
        }
        counts["destinations"] = destsInserted;

        // 3. Hotels
        var hotelsCol = db.GetCollection<Hotel>("hotels");
        var diskHotels = LoadEntitiesFromDisk<Hotel>(siteId, "hotels.json") ?? new List<Hotel>();
        int hotelsInserted = 0;
        foreach (var h in diskHotels)
        {
            var filter = Builders<Hotel>.Filter.Eq(x => x.Slug, h.Slug);
            var existing = await hotelsCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                h.WebsiteId = siteId;
                await hotelsCol.InsertOneAsync(h);
                hotelsInserted++;
            }
        }
        counts["hotels"] = hotelsInserted;

        // 4. Packages
        var packagesCol = db.GetCollection<Package>("packages");
        var diskPackages = LoadEntitiesFromDisk<Package>(siteId, "packages.json") ?? new List<Package>();
        int packagesInserted = 0;
        foreach (var p in diskPackages)
        {
            var filter = Builders<Package>.Filter.Eq(x => x.Slug, p.Slug);
            var existing = await packagesCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                p.WebsiteId = siteId;
                p.Website = siteId;
                await packagesCol.InsertOneAsync(p);
                packagesInserted++;
            }
        }
        counts["packages"] = packagesInserted;

        // 5. Flights
        var flightsCol = db.GetCollection<Flight>("flights");
        var diskFlights = LoadEntitiesFromDisk<Flight>(siteId, "flights.json") ?? new List<Flight>();
        int flightsInserted = 0;
        foreach (var f in diskFlights)
        {
            var filter = Builders<Flight>.Filter.Eq(x => x.Slug, f.Slug);
            var existing = await flightsCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                f.WebsiteId = siteId;
                f.Website = siteId;
                await flightsCol.InsertOneAsync(f);
                flightsInserted++;
            }
        }
        counts["flights"] = flightsInserted;

        // 6. Transfers
        var transfersCol = db.GetCollection<Transfer>("transfers");
        var diskTransfers = LoadEntitiesFromDisk<Transfer>(siteId, "transfers.json") ?? new List<Transfer>();
        int transfersInserted = 0;
        foreach (var t in diskTransfers)
        {
            var filter = Builders<Transfer>.Filter.Eq(x => x.Slug, t.Slug);
            var existing = await transfersCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                t.WebsiteId = siteId;
                t.Website = siteId;
                await transfersCol.InsertOneAsync(t);
                transfersInserted++;
            }
        }
        counts["transfers"] = transfersInserted;

        // 7. Visas
        var visasCol = db.GetCollection<Visa>("visas");
        var diskVisas = LoadEntitiesFromDisk<Visa>(siteId, "visas.json") ?? new List<Visa>();
        int visasInserted = 0;
        foreach (var v in diskVisas)
        {
            var filter = Builders<Visa>.Filter.Eq(x => x.Slug, v.Slug);
            var existing = await visasCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                v.WebsiteId = siteId;
                await visasCol.InsertOneAsync(v);
                visasInserted++;
            }
        }
        counts["visas"] = visasInserted;

        // 8. Restaurants
        var restaurantsCol = db.GetCollection<Restaurant>("restaurants");
        var diskRestaurants = LoadEntitiesFromDisk<Restaurant>(siteId, "restaurants.json") ?? new List<Restaurant>();
        int restaurantsInserted = 0;
        foreach (var r in diskRestaurants)
        {
            var filter = Builders<Restaurant>.Filter.Eq(x => x.Slug, r.Slug);
            var existing = await restaurantsCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                r.WebsiteId = siteId;
                await restaurantsCol.InsertOneAsync(r);
                restaurantsInserted++;
            }
        }
        counts["restaurants"] = restaurantsInserted;

        // 9. Activities
        var activitiesCol = db.GetCollection<Activity>("activities");
        var diskActivities = LoadEntitiesFromDisk<Activity>(siteId, "activities.json") ?? new List<Activity>();
        int activitiesInserted = 0;
        foreach (var a in diskActivities)
        {
            var filter = Builders<Activity>.Filter.Eq(x => x.Slug, a.Slug);
            var existing = await activitiesCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                a.WebsiteId = siteId;
                a.Website = siteId;
                a.TenantId = siteId;
                await activitiesCol.InsertOneAsync(a);
                activitiesInserted++;
            }
        }
        counts["activities"] = activitiesInserted;

        // 10. Categories
        var categoriesCol = db.GetCollection<Category>("categories");
        var diskCategories = LoadEntitiesFromDisk<Category>(siteId, "categories.json") ?? new List<Category>();
        int categoriesInserted = 0;
        foreach (var c in diskCategories)
        {
            var filter = Builders<Category>.Filter.Eq(x => x.Module, c.Module) & Builders<Category>.Filter.Eq(x => x.Slug, c.Slug);
            var existing = await categoriesCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                c.WebsiteId = siteId;
                await categoriesCol.InsertOneAsync(c);
                categoriesInserted++;
            }
        }
        counts["categories"] = categoriesInserted;

        // 11. Build Package Options
        var bpoCol = db.GetCollection<BuildPackageOption>("buildPackageOptions");
        var diskBpo = LoadEntitiesFromDisk<BuildPackageOption>(siteId, "build-package-options.json") ?? new List<BuildPackageOption>();
        int bpoInserted = 0;
        foreach (var b in diskBpo)
        {
            var filter = Builders<BuildPackageOption>.Filter.Eq(x => x.DestinationSlug, b.DestinationSlug);
            var existing = await bpoCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                b.WebsiteId = siteId;
                await bpoCol.InsertOneAsync(b);
                bpoInserted++;
            }
        }
        counts["buildPackageOptions"] = bpoInserted;

        // 12. Banners
        var bannersCol = db.GetCollection<Banner>("hero_banners");
        var seedBanners = SeedDataCatalog.GetBanners(siteId);
        int bannersInserted = 0;
        foreach (var banner in seedBanners)
        {
            var filter = Builders<Banner>.Filter.Eq(x => x.Title, banner.Title);
            var existing = await bannersCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                banner.WebsiteId = siteId;
                await bannersCol.InsertOneAsync(banner);
                bannersInserted++;
            }
        }
        counts["hero_banners"] = bannersInserted;

        // 13. Special Offers
        var offersCol = db.GetCollection<SpecialOffer>("special_offers");
        var seedOffers = SeedDataCatalog.GetOffers(siteId);
        int offersInserted = 0;
        foreach (var offer in seedOffers)
        {
            var filter = Builders<SpecialOffer>.Filter.Eq(x => x.Code, offer.Code);
            var existing = await offersCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                offer.WebsiteId = siteId;
                await offersCol.InsertOneAsync(offer);
                offersInserted++;
            }
        }
        counts["special_offers"] = offersInserted;

        // 14. Travel Videos
        var videosCol = db.GetCollection<TravelVideo>("travel_videos");
        var seedVideos = SeedDataCatalog.GetVideos(siteId);
        int videosInserted = 0;
        foreach (var video in seedVideos)
        {
            var filter = Builders<TravelVideo>.Filter.Eq(x => x.Title, video.Title);
            var existing = await videosCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                video.WebsiteId = siteId;
                await videosCol.InsertOneAsync(video);
                videosInserted++;
            }
        }
        counts["travel_videos"] = videosInserted;

        // 15. Reviews
        var reviewsCol = db.GetCollection<Review>("reviews");
        var seedReviews = SeedDataCatalog.GetReviews(siteId);
        int reviewsInserted = 0;
        foreach (var review in seedReviews)
        {
            var filter = Builders<Review>.Filter.Eq(x => x.Author, review.Author) & Builders<Review>.Filter.Eq(x => x.TourName, review.TourName);
            var existing = await reviewsCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                review.WebsiteId = siteId;
                await reviewsCol.InsertOneAsync(review);
                reviewsInserted++;
            }
        }
        counts["reviews"] = reviewsInserted;

        // 16. FAQs
        var faqsCol = db.GetCollection<FaqItem>("faqs");
        var seedFaqs = SeedDataCatalog.GetFaqs(siteId);
        int faqsInserted = 0;
        foreach (var faq in seedFaqs)
        {
            var filter = Builders<FaqItem>.Filter.Eq(x => x.Question, faq.Question);
            var existing = await faqsCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                faq.WebsiteId = siteId;
                await faqsCol.InsertOneAsync(faq);
                faqsInserted++;
            }
        }
        counts["faqs"] = faqsInserted;

        // 17. Partners
        var partnersCol = db.GetCollection<Partner>("partners");
        var seedPartners = SeedDataCatalog.GetPartners(siteId);
        int partnersInserted = 0;
        foreach (var partner in seedPartners)
        {
            var filter = Builders<Partner>.Filter.Eq(x => x.Name, partner.Name);
            var existing = await partnersCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                partner.WebsiteId = siteId;
                await partnersCol.InsertOneAsync(partner);
                partnersInserted++;
            }
        }
        counts["partners"] = partnersInserted;

        // 18. Static Pages
        var pagesCol = db.GetCollection<StaticPage>("static_pages");
        var seedPages = SeedDataCatalog.GetStaticPages(siteId);
        int pagesInserted = 0;
        foreach (var page in seedPages)
        {
            var filter = Builders<StaticPage>.Filter.Eq(x => x.Slug, page.Slug);
            var existing = await pagesCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                page.WebsiteId = siteId;
                await pagesCol.InsertOneAsync(page);
                pagesInserted++;
            }
        }
        counts["static_pages"] = pagesInserted;

        // Guarantee all unique indexes
        try
        {
            await DatabaseIndexInitializer.EnsureIndexesForDatabaseAsync(db);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Index initialization skipped for tenant '{SiteId}'", siteId);
        }

        return counts;
    }

    private static List<T> LoadEntitiesFromDisk<T>(string siteId, string fileName)
    {
        try
        {
            var currentDir = Directory.GetCurrentDirectory();
            var candidates = new[]
            {
                Path.Combine(currentDir, "seed", siteId, fileName),
                Path.Combine(currentDir, "seed", fileName),
                Path.Combine(currentDir, "..", "..", "seed", siteId, fileName),
                Path.Combine(AppContext.BaseDirectory, "seed", siteId, fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "seed", siteId, fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "backend", "toursApi", "seed", siteId, fileName),
                Path.Combine(currentDir, "Catalog", "Fixtures", fileName)
            };

            foreach (var path in candidates)
            {
                if (System.IO.File.Exists(path))
                {
                    var json = System.IO.File.ReadAllText(path);
                    if (json.StartsWith("\uFEFF")) json = json.Substring(1);
                    var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<T>>(json, opts);
                    if (list != null && list.Count > 0) return list;
                }
            }
        }
        catch
        {
        }
        return new List<T>();
    }

    private List<Tour> GetToursForSite(string siteId)
    {
        return siteId switch
        {
            "tripgoasia" => SeedDataCatalog.Website2Tours(),
            "technoheaven" => SeedDataCatalog.Website3Tours(),
            _ => SeedDataCatalog.Website1Tours()
        };
    }

    private List<Destination> GetDestinationsForSite(string siteId)
    {
        return siteId switch
        {
            "tripgoasia" => SeedDataCatalog.Website2Destinations(),
            "technoheaven" => SeedDataCatalog.Website3Destinations(),
            _ => SeedDataCatalog.Website1Destinations()
        };
    }
}
