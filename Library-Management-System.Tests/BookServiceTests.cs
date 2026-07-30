using Microsoft.EntityFrameworkCore;
using Library_Management_System.Data;
using Library_Management_System.Models;
using Library_Management_System.Services;

namespace Library_Management_System.Tests;

public class BookServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly BookService _service;

    public BookServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _service = new BookService(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task GetPaginatedBooksAsync_ReturnsCorrectPageSizeAndTotalPages()
    {
        // Arrange — seed 12 books (pageSize=5, expect 3 pages)
        for (int i = 1; i <= 12; i++)
        {
            _context.Books.Add(new Book
            {
                Title = $"Book {i}",
                Author = $"Author {i}",
                ISBN = $"978-{i:D10}",
                PublishedDate = DateTime.UtcNow,
                IsAvailable = true
            });
        }
        await _context.SaveChangesAsync();

        // Act — get page 1
        var page1 = await _service.GetPaginatedBooksAsync(null, 1);

        // Assert
        Assert.Equal(5, page1.Books.Count);       // pageSize = 5
        Assert.Equal(12, page1.TotalItems);
        Assert.Equal(3, page1.TotalPages);         // ceil(12/5) = 3
        Assert.Equal(1, page1.CurrentPage);

        // Act — get page 3 (last page, should have 2 books)
        var page3 = await _service.GetPaginatedBooksAsync(null, 3);

        // Assert
        Assert.Equal(2, page3.Books.Count);
        Assert.Equal(3, page3.CurrentPage);
    }

    [Fact]
    public async Task SearchBooksAsync_FiltersByTitleOrAuthorCorrectly()
    {
        // Arrange
        _context.Books.AddRange(
            new Book
            {
                Title = "Clean Code",
                Author = "Robert C. Martin",
                ISBN = "978-0132350884",
                PublishedDate = DateTime.UtcNow,
                IsAvailable = true
            },
            new Book
            {
                Title = "The Pragmatic Programmer",
                Author = "David Thomas",
                ISBN = "978-0135957059",
                PublishedDate = DateTime.UtcNow,
                IsAvailable = true
            },
            new Book
            {
                Title = "Design Patterns",
                Author = "Erich Gamma",
                ISBN = "978-0201633610",
                PublishedDate = DateTime.UtcNow,
                IsAvailable = true
            }
        );
        await _context.SaveChangesAsync();

        // Act — search by title
        var resultByTitle = await _service.GetPaginatedBooksAsync("Clean", 1);

        // Assert
        Assert.Single(resultByTitle.Books);
        Assert.Equal("Clean Code", resultByTitle.Books[0].Title);

        // Act — search by author
        var resultByAuthor = await _service.GetPaginatedBooksAsync("David", 1);

        // Assert
        Assert.Single(resultByAuthor.Books);
        Assert.Equal("The Pragmatic Programmer", resultByAuthor.Books[0].Title);

        // Act — search that matches nothing
        var resultNone = await _service.GetPaginatedBooksAsync("Nonexistent", 1);

        // Assert
        Assert.Empty(resultNone.Books);
        Assert.Equal(0, resultNone.TotalItems);
    }
}
