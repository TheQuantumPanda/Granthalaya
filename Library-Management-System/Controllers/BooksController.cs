using Microsoft.AspNetCore.Mvc;
using Library_Management_System.Models;
using Library_Management_System.DTOs;
using Library_Management_System.Services;

namespace Library_Management_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly IBookService _bookService;

    public BooksController(IBookService bookService)
    {
        _bookService = bookService;
    }

    // GET /api/books?searchQuery=...&page=1
    [HttpGet]
    public async Task<ActionResult<BookListResponseDto>> GetBooks(
        [FromQuery] string? searchQuery,
        [FromQuery] int page = 1)
    {
        var response = await _bookService.GetPaginatedBooksAsync(searchQuery, page);
        return Ok(response);
    }

    // GET /api/books/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Book>> GetBook(int id)
    {
        var book = await _bookService.GetBookByIdAsync(id);

        if (book == null)
        {
            return NotFound(new { message = $"Book with ID {id} not found." });
        }

        return Ok(book);
    }

    // POST /api/books
    [HttpPost]
    public async Task<ActionResult<Book>> CreateBook([FromBody] Book book)
    {
        var created = await _bookService.CreateBookAsync(book);
        return CreatedAtAction(nameof(GetBook), new { id = created.BookId }, created);
    }

    // PUT /api/books/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBook(int id, [FromBody] Book book)
    {
        if (id != book.BookId)
        {
            return BadRequest(new { message = "Book ID in URL does not match body." });
        }

        var updated = await _bookService.UpdateBookAsync(id, book);
        if (updated == null)
        {
            return NotFound(new { message = $"Book with ID {id} not found." });
        }

        return Ok(updated);
    }

    // DELETE /api/books/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBook(int id)
    {
        var deleted = await _bookService.DeleteBookAsync(id);
        if (deleted == null)
        {
            return NotFound(new { message = $"Book with ID {id} not found." });
        }

        return Ok(new { message = $"Book '{deleted.Title}' deleted successfully." });
    }
}
