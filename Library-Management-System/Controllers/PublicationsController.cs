using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;

namespace Library_Management_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PublicationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PublicationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET /api/publications?type=Newspaper&searchTerm=...&page=1
    [HttpGet]
    public async Task<IActionResult> GetPublications(
        [FromQuery] string? type,
        [FromQuery] string? searchTerm,
        [FromQuery] int page = 1)
    {
        const int pageSize = 5;

        var query = _context.Publications.AsQueryable();

        // Filter by publication type if provided
        if (!string.IsNullOrWhiteSpace(type) &&
            Enum.TryParse<PublicationType>(type, ignoreCase: true, out var pubType))
        {
            query = query.Where(p => p.Type == pubType);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim();
            query = query.Where(p =>
                p.Title.Contains(term) ||
                p.Publisher.Contains(term));
        }

        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var publications = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            publications,
            currentPage = page,
            totalPages,
            totalItems
        });
    }

    // GET /api/publications/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Publication>> GetPublication(int id)
    {
        var publication = await _context.Publications.FindAsync(id);

        if (publication == null)
        {
            return NotFound(new { message = $"Publication with ID {id} not found." });
        }

        return Ok(publication);
    }

    // POST /api/publications
    [HttpPost]
    public async Task<ActionResult<Publication>> CreatePublication([FromBody] CreatePublicationDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var publication = new Publication
        {
            Title = dto.Title,
            Publisher = dto.Publisher,
            PublishedDate = dto.PublishedDate,
            Type = dto.Type,
            IsAvailable = dto.IsAvailable
        };

        _context.Publications.Add(publication);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPublication), new { id = publication.Id }, publication);
    }

    // PUT /api/publications/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePublication(int id, [FromBody] CreatePublicationDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var existing = await _context.Publications.FindAsync(id);
        if (existing == null)
        {
            return NotFound(new { message = $"Publication with ID {id} not found." });
        }

        existing.Title = dto.Title;
        existing.Publisher = dto.Publisher;
        existing.PublishedDate = dto.PublishedDate;
        existing.Type = dto.Type;
        existing.IsAvailable = dto.IsAvailable;

        await _context.SaveChangesAsync();

        return Ok(existing);
    }

    // DELETE /api/publications/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePublication(int id)
    {
        var publication = await _context.Publications.FindAsync(id);
        if (publication == null)
        {
            return NotFound(new { message = $"Publication with ID {id} not found." });
        }

        _context.Publications.Remove(publication);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Publication '{publication.Title}' deleted successfully." });
    }
}
