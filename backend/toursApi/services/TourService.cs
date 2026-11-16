using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Services;

public class TourService : ITourService
{
    private readonly ITourRepository _repository;
    private readonly IWebsiteContext _websiteContext;

    public TourService(ITourRepository repository, IWebsiteContext websiteContext)
    {
        _repository = repository;
        _websiteContext = websiteContext;
    }

    public async Task<IEnumerable<Tour>> GetAllToursAsync(
        string? category = null,
        bool? featured = null,
        bool? popular = null,
        int? page = null,
        int? limit = null,
        string? sort = null)
    {
        return await _repository.GetAllAsync(category, featured, popular, page, limit, sort);
    }

    public async Task<int> GetToursCountAsync(
        string? category = null,
        bool? featured = null,
        bool? popular = null)
    {
        return await _repository.GetCountAsync(category, featured, popular);
    }

    public async Task<Tour?> GetTourByIdAsync(string id)
    {
        return await _repository.GetByIdAsync(id);
    }

    public async Task<Tour?> GetTourBySlugAsync(string slug)
    {
        return await _repository.GetBySlugAsync(slug);
    }

    public async Task<Tour?> GetTourByNumericIdAsync(int numericId)
    {
        return await _repository.GetByNumericIdAsync(numericId);
    }

    public async Task CreateTourAsync(Tour tour)
    {
        tour.Website = _websiteContext.CurrentWebsiteId;
        tour.WebsiteId = _websiteContext.CurrentWebsiteId;
        tour.CreatedAt = DateTime.UtcNow;
        tour.UpdatedAt = DateTime.UtcNow;
        await _repository.CreateAsync(tour);
    }

    public async Task<bool> UpsertTourBySlugAsync(Tour tour)
    {
        tour.Website = _websiteContext.CurrentWebsiteId;
        tour.WebsiteId = _websiteContext.CurrentWebsiteId;
        return await _repository.UpsertBySlugAsync(tour);
    }

    public async Task UpdateTourAsync(string id, Tour tour)
    {
        tour.Website = _websiteContext.CurrentWebsiteId;
        tour.WebsiteId = _websiteContext.CurrentWebsiteId;
        tour.UpdatedAt = DateTime.UtcNow;
        await _repository.UpdateAsync(id, tour);
    }

    public async Task DeleteTourAsync(string id)
    {
        await _repository.DeleteAsync(id);
    }

    public async Task<IEnumerable<Tour>> SearchToursAsync(string? q, double? minPrice, double? maxPrice, string? difficulty, string? sort = null)
    {
        return await _repository.SearchAsync(q, minPrice, maxPrice, difficulty, sort);
    }

    public async Task<IEnumerable<Tour>> GetSimilarToursAsync(string tourIdOrSlug, int limit = 4)
    {
        return await _repository.GetSimilarToursAsync(tourIdOrSlug, limit);
    }

    public async Task<GuestReview?> AddReviewAsync(string tourIdOrSlug, GuestReview review)
    {
        return await _repository.AddReviewAsync(tourIdOrSlug, review);
    }
}
