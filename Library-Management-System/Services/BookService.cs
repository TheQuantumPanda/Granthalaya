using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Services;

public class BookService : IBookService
{
    private readonly ApplicationDbContext _context;
    public BookService(ApplicationDbContext context) => _context = context;

    private static IQueryable<BookDto> Project(IQueryable<Book> source) => source.Select(b => new BookDto
    {
        BookId = b.BookId,
        Title = b.Title,
        Author = b.Author,
        ISBN = b.ISBN,
        Genre = b.Genre,
        Publisher = b.Publisher,
        PublicationYear = b.PublicationYear,
        Description = b.Description,
        CopyCount = b.BookCopies.Count,
        AvailableCopyCount = b.BookCopies.Count(c => c.Status == CopyStatus.Circulating &&
            !c.BorrowRecords.Any(r => r.ReturnDate == null)),
        BookCopies = b.BookCopies.OrderBy(c => c.BookCopyId).Select(c => new BookCopyDto
        {
            BookCopyId = c.BookCopyId,
            BookId = c.BookId,
            AccessionNumber = c.AccessionNumber,
            Condition = c.Condition,
            Status = c.Status,
            CreatedAt = c.CreatedAt,
            IsAvailable = c.Status == CopyStatus.Circulating &&
                !c.BorrowRecords.Any(r => r.ReturnDate == null)
        }).ToList()
    });

    public async Task<BookListResponseDto> GetPaginatedBooksAsync(string? searchQuery, int page, int pageSize)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _context.Books.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(searchQuery))
        {
            var term = searchQuery.Trim();
            query = query.Where(b => b.Title.Contains(term) || b.Author.Contains(term) || b.ISBN.Contains(term));
        }
        var total = await query.CountAsync();
        return new BookListResponseDto
        {
            Books = await Project(query.OrderBy(b => b.BookId).Skip((page - 1) * pageSize).Take(pageSize)).ToListAsync(),
            CurrentPage = page,
            TotalPages = (int)Math.Ceiling(total / (double)pageSize),
            TotalItems = total,
            SearchQuery = searchQuery ?? string.Empty
        };
    }

    public Task<BookDto?> GetBookByIdAsync(int id) =>
        Project(_context.Books.AsNoTracking().Where(b => b.BookId == id)).FirstOrDefaultAsync();

    public async Task<BookDto> CreateBookAsync(BookRequestDto request)
    {
        var book = new Book();
        Apply(book, request);
        _context.Books.Add(book);
        await _context.SaveChangesAsync();
        return (await GetBookByIdAsync(book.BookId))!;
    }

    public async Task<BookDto?> UpdateBookAsync(int id, BookRequestDto request)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return null;
        Apply(book, request);
        await _context.SaveChangesAsync();
        return await GetBookByIdAsync(id);
    }

    public async Task<bool> DeleteBookAsync(int id)
    {
        var book = await _context.Books.Include(b => b.BookCopies).FirstOrDefaultAsync(b => b.BookId == id);
        if (book == null) return false;
        var copyIds = book.BookCopies.Select(c => c.BookCopyId).ToList();
        if (await _context.BorrowRecords.AnyAsync(r => copyIds.Contains(r.BookCopyId)))
            throw new InvalidOperationException("Books with borrowing history cannot be deleted.");
        _context.BookCopies.RemoveRange(book.BookCopies);
        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
        return true;
    }

    private static void Apply(Book book, BookRequestDto request)
    {
        book.Title = request.Title.Trim();
        book.Author = request.Author.Trim();
        book.ISBN = request.ISBN.Trim();
        book.Genre = request.Genre.Trim();
        book.Publisher = request.Publisher.Trim();
        book.PublicationYear = request.PublicationYear;
        book.Description = request.Description.Trim();
    }
}
