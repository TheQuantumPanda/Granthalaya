using Microsoft.EntityFrameworkCore;
using Library_Management_System.Data;
using Library_Management_System.Models;
using Library_Management_System.Services;

namespace Library_Management_System.Tests;

public class DashboardServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly DashboardService _service;

    public DashboardServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _service = new DashboardService(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task GetMetricsAsync_ReturnsAccurateCounts()
    {
        // Arrange
        _context.Students.AddRange(
            new Student { StudentName = "Alice", Email = "a@test.com", Phone = "111", Gender = "F", Address = "Addr1" },
            new Student { StudentName = "Bob", Email = "b@test.com", Phone = "222", Gender = "M", Address = "Addr2" },
            new Student { StudentName = "Charlie", Email = "c@test.com", Phone = "333", Gender = "M", Address = "Addr3" }
        );

        _context.Books.AddRange(
            new Book { Title = "Book1", Author = "A1", ISBN = "001", PublishedDate = DateTime.UtcNow, IsAvailable = true },
            new Book { Title = "Book2", Author = "A2", ISBN = "002", PublishedDate = DateTime.UtcNow, IsAvailable = true }
        );

        _context.Librarians.AddRange(
            new Librarian { Name = "Lib1", Age = 30, Phone = "444" }
        );

        _context.BorrowRecords.Add(new BorrowRecord
        {
            BookId = 1, // will be assigned by InMemory provider
            BorrowerName = "Alice",
            BorrowerEmail = "a@test.com",
            Phone = "111",
            BorrowDate = DateTime.UtcNow
        });

        _context.Publications.AddRange(
            new Publication { Title = "Pub1", Publisher = "P1", PublishedDate = DateTime.UtcNow, Type = PublicationType.Newspaper, IsAvailable = true },
            new Publication { Title = "Pub2", Publisher = "P2", PublishedDate = DateTime.UtcNow, Type = PublicationType.Magazine, IsAvailable = true },
            new Publication { Title = "Pub3", Publisher = "P3", PublishedDate = DateTime.UtcNow, Type = PublicationType.Magazine, IsAvailable = true },
            new Publication { Title = "Pub4", Publisher = "P4", PublishedDate = DateTime.UtcNow, Type = PublicationType.Newspaper, IsAvailable = true }
        );

        await _context.SaveChangesAsync();

        // Act
        var metrics = await _service.GetMetricsAsync();

        // Assert
        Assert.Equal(3, metrics.TotalStudents);
        Assert.Equal(2, metrics.TotalBooks);
        Assert.Equal(1, metrics.TotalLibrarians);
        Assert.Equal(1, metrics.TotalBorrowings);
        Assert.Equal(4, metrics.TotalPublications);
    }
}
