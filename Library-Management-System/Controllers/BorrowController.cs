using Microsoft.AspNetCore.Mvc;
using Library_Management_System.DTOs;
using Library_Management_System.Models;
using Library_Management_System.Services;

namespace Library_Management_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BorrowController : ControllerBase
{
    private readonly IBorrowService _borrowService;

    public BorrowController(IBorrowService borrowService)
    {
        _borrowService = borrowService;
    }

    // POST /api/borrow
    [HttpPost]
    public async Task<IActionResult> BorrowBook([FromBody] BorrowRequestDto request)
    {
        try
        {
            var record = await _borrowService.BorrowBookAsync(request);
            return Ok(new
            {
                message = "Book borrowed successfully.",
                borrowRecordId = record.BorrowRecordId,
                borrowDate = record.BorrowDate
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST /api/borrow/return/{borrowRecordId}
    [HttpPost("return/{borrowRecordId}")]
    public async Task<IActionResult> ReturnBook(int borrowRecordId)
    {
        try
        {
            var record = await _borrowService.ReturnBookAsync(borrowRecordId);
            return Ok(new
            {
                message = "Book returned successfully.",
                bookTitle = record.Book.Title,
                returnDate = record.ReturnDate
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/borrow/records
    [HttpGet("records")]
    public async Task<ActionResult<List<BorrowRecord>>> GetBorrowRecords()
    {
        var records = await _borrowService.GetAllBorrowRecordsAsync();
        return Ok(records);
    }
}
