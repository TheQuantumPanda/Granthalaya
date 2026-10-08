using Microsoft.AspNetCore.Authorization;
using Library_Management_System.Security;
using Library_Management_System.DTOs;
using Library_Management_System.Services;
using Microsoft.AspNetCore.Mvc;

namespace Library_Management_System.Controllers;

[Authorize(Policy = StaffSecurity.Staff)]
[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly IBookService _books;
    private readonly IBookCopyService _copies;
    public BooksController(IBookService books, IBookCopyService copies)
    {
        _books = books;
        _copies = copies;
    }

    [HttpGet]
    public async Task<ActionResult<BookListResponseDto>> GetBooks(
        [FromQuery] string? searchQuery, [FromQuery] int page = 1, [FromQuery] int pageSize = 5) =>
        Ok(await _books.GetPaginatedBooksAsync(searchQuery, page, pageSize));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookDto>> GetBook(int id) =>
        await _books.GetBookByIdAsync(id) is { } book ? Ok(book) : NotFound();

    [HttpPost]
    public async Task<ActionResult<BookDto>> CreateBook([FromBody] BookRequestDto request)
    {
        var book = await _books.CreateBookAsync(request);
        return CreatedAtAction(nameof(GetBook), new { id = book.BookId }, book);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BookDto>> UpdateBook(int id, [FromBody] BookRequestDto request) =>
        await _books.UpdateBookAsync(id, request) is { } book ? Ok(book) : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBook(int id) =>
        await _books.DeleteBookAsync(id) ? NoContent() : NotFound();

    [HttpPost("{bookId:int}/copies")]
    public async Task<ActionResult<BookCopyDto>> CreateCopy(int bookId, [FromBody] BookCopyRequestDto request, CancellationToken ct)
    {
        var copy = await _copies.CreateAsync(bookId, request, ct);
        return CreatedAtAction(nameof(GetCopy), new { bookId, copyId = copy.BookCopyId }, copy);
    }

    [HttpGet("{bookId:int}/copies/{copyId:int}")]
    public async Task<ActionResult<BookCopyDto>> GetCopy(int bookId, int copyId, CancellationToken ct) =>
        await _copies.GetAsync(bookId, copyId, ct) is { } copy ? Ok(copy) : NotFound();

    [HttpPut("{bookId:int}/copies/{copyId:int}")]
    public async Task<ActionResult<BookCopyDto>> UpdateCopy(int bookId, int copyId, [FromBody] BookCopyRequestDto request, CancellationToken ct) =>
        await _copies.UpdateAsync(bookId, copyId, request, ct) is { } copy ? Ok(copy) : NotFound();

    [HttpDelete("{bookId:int}/copies/{copyId:int}")]
    public async Task<IActionResult> DeleteCopy(int bookId, int copyId, CancellationToken ct) =>
        await _copies.DeleteAsync(bookId, copyId, ct) ? NoContent() : NotFound();
}
