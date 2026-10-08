using Library_Management_System.DTOs;
using Library_Management_System.Security;
using Library_Management_System.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Library_Management_System.Controllers;

[ApiController, Route("api/contact"), Authorize(Policy = StaffSecurity.Admin)]
public sealed class ContactController(IDirectoryService directory) : ControllerBase
{
    [AllowAnonymous, EnableRateLimiting("contact"), HttpPost]
    public async Task<IActionResult> SubmitMessage([FromBody] ContactRequestDto request, CancellationToken ct)
    {
        await directory.SubmitContactAsync(request, ct);
        return Accepted();
    }
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ContactMessageDto>>> GetMessages(CancellationToken ct) => Ok(await directory.ContactMessagesAsync(ct));
}
