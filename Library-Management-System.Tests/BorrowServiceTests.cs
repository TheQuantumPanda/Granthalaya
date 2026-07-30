using Microsoft.EntityFrameworkCore;
using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;
using Library_Management_System.Services;

namespace Library_Management_System.Tests;

public class BorrowServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly BorrowService _service;

    public BorrowServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _service = new BorrowService(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task BorrowBookAsync_ValidBook_SetsIsAvailableToFalseAndCreatesRecord()
    {
        // Arrange
        var book = new Book
        {
            Title = "Test Book",
            Author = "Test Author",
            ISBN = "978-0000000001",
            PublishedDate = DateTime.UtcNow,
            IsAvailable = true
        };
        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var request = new BorrowRequestDto
        {
            BookId = book.BookId,
            BorrowerName = "John Doe",
            BorrowerEmail = "john@example.com",
            Phone = "555-1234"
        };

        // Act
        var record = await _service.BorrowBookAsync(request);

        // Assert
        Assert.NotNull(record);
        Assert.Equal(book.BookId, record.BookId);
        Assert.Equal("John Doe", record.BorrowerName);
        Assert.Equal("john@example.com", record.BorrowerEmail);
        Assert.True(record.BorrowDate <= DateTime.UtcNow);
        Assert.Null(record.ReturnDate);

        var updatedBook = await _context.Books.FindAsync(book.BookId);
        Assert.NotNull(updatedBook);
        Assert.False(updatedBook.IsAvailable);
    }

    [Fact]
    public async Task BorrowBookAsync_AlreadyBorrowedBook_ThrowsInvalidOperationException()
    {
        // Arrange
        var book = new Book
        {
            Title = "Borrowed Book",
            Author = "Author",
            ISBN = "978-0000000002",
            PublishedDate = DateTime.UtcNow,
            IsAvailable = false // already borrowed
        };
        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var request = new BorrowRequestDto
        {
            BookId = book.BookId,
            BorrowerName = "Jane Doe",
            BorrowerEmail = "jane@example.com",
            Phone = "555-5678"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.BorrowBookAsync(request));

        Assert.Contains("already borrowed", exception.Message);
    }

    [Fact]
    public async Task ReturnBookAsync_ValidRecord_SetsIsAvailableToTrueAndStampsReturnDate()
    {
        // Arrange
        var book = new Book
        {
            Title = "Returnable Book",
            Author = "Author",
            ISBN = "978-0000000003",
            PublishedDate = DateTime.UtcNow,
            IsAvailable = false
        };
        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var borrowRecord = new BorrowRecord
        {
            BookId = book.BookId,
            BorrowerName = "Alice",
            BorrowerEmail = "alice@example.com",
            Phone = "555-9999",
            BorrowDate = DateTime.UtcNow.AddDays(-7),
            ReturnDate = null
        };
        _context.BorrowRecords.Add(borrowRecord);
        await _context.SaveChangesAsync();

        // Act
        var returned = await _service.ReturnBookAsync(borrowRecord.BorrowRecordId);

        // Assert
        Assert.NotNull(returned);
        Assert.NotNull(returned.ReturnDate);
        Assert.True(returned.ReturnDate <= DateTime.UtcNow);

        var updatedBook = await _context.Books.FindAsync(book.BookId);
        Assert.NotNull(updatedBook);
        Assert.True(updatedBook.IsAvailable);
    }
}
