using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;
using Library_Management_System.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly IBookService _books;
    private readonly ApplicationDbContext _context;
    public BooksController(IBookService books, ApplicationDbContext context)
    {
        _books = books;
        _context = context;
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
        try
        {
            var book = await _books.CreateBookAsync(request);
            return CreatedAtAction(nameof(GetBook), new { id = book.BookId }, book);
        }
        catch (DbUpdateException ex) when (PersistenceErrors.IsUniqueViolation(ex))
        {
            return Conflict(new { message = "ISBN already exists." });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BookDto>> UpdateBook(int id, [FromBody] BookRequestDto request)
    {
        try
        {
            return await _books.UpdateBookAsync(id, request) is { } book ? Ok(book) : NotFound();
        }
        catch (DbUpdateException ex) when (PersistenceErrors.IsUniqueViolation(ex))
        {
            return Conflict(new { message = "ISBN already exists." });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBook(int id)
    {
        try
        {
            return await _books.DeleteBookAsync(id) ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (DbUpdateException ex) when (PersistenceErrors.IsForeignKeyViolation(ex))
        {
            return Conflict(new { message = "Book has dependent records." });
        }
    }

    [HttpPost("{bookId:int}/copies")]
    public async Task<ActionResult<BookCopyDto>> CreateCopy(int bookId, [FromBody] BookCopyRequestDto request)
    {
        if (!await _context.Books.AnyAsync(b => b.BookId == bookId)) return NotFound();
        var copy = new BookCopy
        {
            BookId = bookId,
            AccessionNumber = request.AccessionNumber.Trim(),
            Condition = request.Condition.Trim(),
            Status = request.Status
        };
        _context.BookCopies.Add(copy);
        try
        {
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCopy), new { bookId, copyId = copy.BookCopyId }, ToDto(copy, copy.Status == CopyStatus.Circulating));
        }
        catch (DbUpdateException ex) when (PersistenceErrors.IsUniqueViolation(ex))
        {
            return Conflict(new { message = "Accession number already exists." });
        }
    }

    [HttpGet("{bookId:int}/copies/{copyId:int}")]
    public async Task<ActionResult<BookCopyDto>> GetCopy(int bookId, int copyId)
    {
        var copy = await _context.BookCopies.AsNoTracking()
            .FirstOrDefaultAsync(c => c.BookId == bookId && c.BookCopyId == copyId);
        if (copy == null) return NotFound();
        var active = await _context.BorrowRecords.AnyAsync(r => r.BookCopyId == copyId && r.ReturnDate == null);
        return Ok(ToDto(copy, !active && copy.Status == CopyStatus.Circulating));
    }

    [HttpPut("{bookId:int}/copies/{copyId:int}")]
    public async Task<ActionResult<BookCopyDto>> UpdateCopy(int bookId, int copyId, [FromBody] BookCopyRequestDto request)
    {
        var copy = await _context.BookCopies.FirstOrDefaultAsync(c => c.BookId == bookId && c.BookCopyId == copyId);
        if (copy == null) return NotFound();
        var hasActiveLoan = await _context.BorrowRecords.AnyAsync(r => r.BookCopyId == copyId && r.ReturnDate == null);
        if (hasActiveLoan && request.Status != CopyStatus.Circulating)
            return Conflict(new { message = "Return the active loan before changing copy status." });
        copy.AccessionNumber = request.AccessionNumber.Trim();
        copy.Condition = request.Condition.Trim();
        copy.Status = request.Status;
        try
        {
            await _context.SaveChangesAsync();
            return Ok(ToDto(copy, !hasActiveLoan && copy.Status == CopyStatus.Circulating));
        }
        catch (DbUpdateException ex) when (PersistenceErrors.IsUniqueViolation(ex))
        {
            return Conflict(new { message = "Accession number already exists." });
        }
    }

    [HttpDelete("{bookId:int}/copies/{copyId:int}")]
    public async Task<IActionResult> DeleteCopy(int bookId, int copyId)
    {
        var copy = await _context.BookCopies.FirstOrDefaultAsync(c => c.BookId == bookId && c.BookCopyId == copyId);
        if (copy == null) return NotFound();
        if (await _context.BorrowRecords.AnyAsync(r => r.BookCopyId == copyId))
            return Conflict(new { message = "Copies with borrowing history cannot be deleted." });
        _context.BookCopies.Remove(copy);
        try
        {
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateException ex) when (PersistenceErrors.IsForeignKeyViolation(ex))
        {
            return Conflict(new { message = "Copy has borrowing history." });
        }
    }

    private static BookCopyDto ToDto(BookCopy c, bool isAvailable) => new()
    {
        BookCopyId = c.BookCopyId, BookId = c.BookId, AccessionNumber = c.AccessionNumber,
        Condition = c.Condition, Status = c.Status, CreatedAt = c.CreatedAt,
        IsAvailable = isAvailable
    };
}
