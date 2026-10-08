using Library_Management_System.DTOs;
using Library_Management_System.Services;
using Microsoft.AspNetCore.Mvc;

namespace Library_Management_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BorrowController : ControllerBase
{
    private readonly IBorrowService _borrow;
    public BorrowController(IBorrowService borrow) => _borrow = borrow;

    [HttpPost]
    public async Task<ActionResult<BorrowRecordDto>> BorrowBook([FromBody] BorrowRequestDto request)
    {
        try { return Ok(await _borrow.BorrowBookAsync(request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("return/{borrowRecordId:int}")]
    public async Task<ActionResult<BorrowRecordDto>> ReturnBook(int borrowRecordId)
    {
        try { return Ok(await _borrow.ReturnBookAsync(borrowRecordId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("records")]
    public async Task<ActionResult<List<BorrowRecordDto>>> GetBorrowRecords() =>
        Ok(await _borrow.GetAllBorrowRecordsAsync());
}
