using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Library_Management_System.Data;
using Library_Management_System.Models;

namespace Library_Management_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LibrariansController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public LibrariansController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET /api/librarians?searchTerm=...&page=1
    [HttpGet]
    public async Task<IActionResult> GetLibrarians(
        [FromQuery] string? searchTerm,
        [FromQuery] int page = 1)
    {
        const int pageSize = 5;

        var query = _context.Librarians.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim();
            query = query.Where(l => l.Name.Contains(term));
        }

        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var librarians = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            librarians,
            currentPage = page,
            totalPages,
            totalItems
        });
    }

    // GET /api/librarians/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Librarian>> GetLibrarian(int id)
    {
        var librarian = await _context.Librarians.FindAsync(id);

        if (librarian == null)
        {
            return NotFound(new { message = $"Librarian with ID {id} not found." });
        }

        return Ok(librarian);
    }

    // POST /api/librarians
    [HttpPost]
    public async Task<ActionResult<Librarian>> CreateLibrarian([FromBody] Librarian librarian)
    {
        _context.Librarians.Add(librarian);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLibrarian), new { id = librarian.LibrarianId }, librarian);
    }

    // PUT /api/librarians/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLibrarian(int id, [FromBody] Librarian librarian)
    {
        if (id != librarian.LibrarianId)
        {
            return BadRequest(new { message = "Librarian ID in URL does not match body." });
        }

        var existing = await _context.Librarians.FindAsync(id);
        if (existing == null)
        {
            return NotFound(new { message = $"Librarian with ID {id} not found." });
        }

        existing.Name = librarian.Name;
        existing.Age = librarian.Age;
        existing.Phone = librarian.Phone;

        await _context.SaveChangesAsync();

        return Ok(existing);
    }

    // DELETE /api/librarians/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLibrarian(int id)
    {
        var librarian = await _context.Librarians.FindAsync(id);
        if (librarian == null)
        {
            return NotFound(new { message = $"Librarian with ID {id} not found." });
        }

        _context.Librarians.Remove(librarian);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Librarian '{librarian.Name}' deleted successfully." });
    }
}
