using Microsoft.EntityFrameworkCore;
using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;

namespace Library_Management_System.Services;

public class BookService : IBookService
{
    private readonly ApplicationDbContext _context;

    public BookService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BookListResponseDto> GetPaginatedBooksAsync(string? searchQuery, int page)
    {
        const int pageSize = 5;

        var query = _context.Books.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchQuery))
        {
            var search = searchQuery.Trim();
            query = query.Where(b =>
                b.Title.Contains(search) ||
                b.Author.Contains(search) ||
                b.ISBN.Contains(search));
        }

        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var books = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new BookListResponseDto
        {
            Books = books,
            CurrentPage = page,
            TotalPages = totalPages,
            TotalItems = totalItems,
            SearchQuery = searchQuery ?? string.Empty
        };
    }

    public async Task<Book?> GetBookByIdAsync(int id)
    {
        return await _context.Books.FindAsync(id);
    }

    public async Task<Book> CreateBookAsync(Book book)
    {
        _context.Books.Add(book);
        await _context.SaveChangesAsync();
        return book;
    }

    public async Task<Book?> UpdateBookAsync(int id, Book book)
    {
        var existing = await _context.Books.FindAsync(id);
        if (existing == null)
            return null;

        existing.Title = book.Title;
        existing.Author = book.Author;
        existing.ISBN = book.ISBN;
        existing.PublishedDate = book.PublishedDate;
        existing.IsAvailable = book.IsAvailable;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<Book?> DeleteBookAsync(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null)
            return null;

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
        return book;
    }
}
