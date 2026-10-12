using Library_Management_System.DTOs;
using Library_Management_System.Security;
using Library_Management_System.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Library_Management_System.Controllers;

[ApiController, Route("api/publications"), Authorize(Policy = StaffSecurity.Staff)]
public sealed class PublicationsController(IDirectoryService directory) : ControllerBase
{
    [HttpGet] public async Task<ActionResult<PublicationPageDto>> GetPublications(string? type, string? searchTerm, int page = 1, CancellationToken ct = default) => Ok(await directory.PublicationsAsync(type, searchTerm, page, ct));
    [HttpGet("{id:int}")] public async Task<ActionResult<PublicationDto>> GetPublication(int id, CancellationToken ct) => await directory.PublicationAsync(id, ct) is { } x ? Ok(x) : NotFound();
    [HttpPost] public async Task<ActionResult<PublicationDto>> CreatePublication([FromBody] CreatePublicationDto request, CancellationToken ct) { var x = await directory.CreatePublicationAsync(request, ct); return CreatedAtAction(nameof(GetPublication), new { id = x.Id }, x); }
    [HttpPut("{id:int}")] public async Task<ActionResult<PublicationDto>> UpdatePublication(int id, [FromBody] CreatePublicationDto request, CancellationToken ct) => await directory.UpdatePublicationAsync(id, request, ct) is { } x ? Ok(x) : NotFound();
    [HttpDelete("{id:int}")] public async Task<IActionResult> DeletePublication(int id, CancellationToken ct) => await directory.DeletePublicationAsync(id, ct) ? NoContent() : NotFound();
}
