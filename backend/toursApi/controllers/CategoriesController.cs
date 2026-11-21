using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using ToursApi.Repositories;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoriesController(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories([FromQuery] string? module)
    {
        if (string.IsNullOrWhiteSpace(module))
        {
            var all = await _categoryRepository.GetAllCategoriesAsync();
            return Ok(new
            {
                success = true,
                items = all,
                total = all.Count,
                page = 1,
                pageSize = all.Count,
                data = all
            });
        }

        var categories = await _categoryRepository.GetCategoriesByModuleAsync(module);
        return Ok(new
        {
            success = true,
            items = categories,
            total = categories.Count,
            page = 1,
            pageSize = categories.Count,
            data = categories
        });
    }

    [HttpGet("{module}/{slug}")]
    public async Task<IActionResult> GetCategoryBySlug(string module, string slug)
    {
        var category = await _categoryRepository.GetCategoryBySlugAsync(module, slug);
        if (category == null)
        {
            return NotFound(new { success = false, error = $"Category '{slug}' in module '{module}' not found." });
        }

        return Ok(new { success = true, data = category });
    }
}

