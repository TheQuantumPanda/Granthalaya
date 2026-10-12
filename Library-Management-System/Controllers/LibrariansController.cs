using Library_Management_System.DTOs;
using Library_Management_System.Security;
using Library_Management_System.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Library_Management_System.Controllers;

[ApiController, Route("api/librarians"), Authorize(Policy = StaffSecurity.Admin)]
public sealed class LibrariansController(IDirectoryService directory) : ControllerBase
{
    [HttpGet] public async Task<ActionResult<LibrarianPageDto>> GetLibrarians(string? searchTerm, int page = 1, CancellationToken ct = default) => Ok(await directory.LibrariansAsync(searchTerm, page, ct));
    [HttpGet("{id:int}")] public async Task<ActionResult<LibrarianDto>> GetLibrarian(int id, CancellationToken ct) => await directory.LibrarianAsync(id, ct) is { } x ? Ok(x) : NotFound();
    [HttpPost] public async Task<ActionResult<LibrarianDto>> CreateLibrarian([FromBody] LibrarianRequestDto request, CancellationToken ct) { var x = await directory.CreateLibrarianAsync(request, ct); return CreatedAtAction(nameof(GetLibrarian), new { id = x.LibrarianId }, x); }
    [HttpPut("{id:int}")] public async Task<ActionResult<LibrarianDto>> UpdateLibrarian(int id, [FromBody] LibrarianRequestDto request, CancellationToken ct) => await directory.UpdateLibrarianAsync(id, request, ct) is { } x ? Ok(x) : NotFound();
    [HttpDelete("{id:int}")] public async Task<IActionResult> DeleteLibrarian(int id, CancellationToken ct) => await directory.DeleteLibrarianAsync(id, ct) ? NoContent() : NotFound();
}
