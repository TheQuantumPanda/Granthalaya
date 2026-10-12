using Microsoft.AspNetCore.Authorization;
using Library_Management_System.Security;
using Library_Management_System.DTOs;
using Library_Management_System.Services;
using Microsoft.AspNetCore.Mvc;

namespace Library_Management_System.Controllers;

[Authorize(Policy = StaffSecurity.Staff)]
[ApiController]
[Route("api/[controller]")]
public class BorrowController : ControllerBase
{
    private readonly IBorrowService _borrow;
    public BorrowController(IBorrowService borrow) => _borrow = borrow;

    [HttpPost]
    public async Task<ActionResult<BorrowRecordDto>> BorrowBook([FromBody] BorrowRequestDto request) =>
        Ok(await _borrow.BorrowBookAsync(request));

    [HttpPost("return/{borrowRecordId:int}")]
    public async Task<ActionResult<BorrowRecordDto>> ReturnBook(int borrowRecordId) =>
        Ok(await _borrow.ReturnBookAsync(borrowRecordId));

    [HttpGet("records")]
    public async Task<ActionResult<BorrowRecordPageDto>> GetBorrowRecords(string? search, string? status, int page = 1, int pageSize = 5) =>
        Ok(await _borrow.GetRecordsAsync(search, status, page, pageSize));
}
