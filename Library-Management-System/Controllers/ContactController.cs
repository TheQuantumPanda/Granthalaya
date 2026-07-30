using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Library_Management_System.Data;
using Library_Management_System.Models;

namespace Library_Management_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ContactController(ApplicationDbContext context)
    {
        _context = context;
    }

    // POST /api/contact
    [HttpPost]
    public async Task<IActionResult> SubmitMessage([FromBody] ContactMessage contactMessage)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        contactMessage.SubmittedAt = DateTime.UtcNow;

        _context.ContactMessages.Add(contactMessage);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Message received successfully." });
    }

    // GET /api/contact
    [HttpGet]
    public async Task<ActionResult<List<ContactMessage>>> GetMessages()
    {
        var messages = await _context.ContactMessages
            .OrderByDescending(m => m.SubmittedAt)
            .ToListAsync();

        return Ok(messages);
    }
}
