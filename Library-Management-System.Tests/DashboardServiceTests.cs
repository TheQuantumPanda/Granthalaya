using Library_Management_System.Data;
using Library_Management_System.Models;
using Library_Management_System.Services;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Tests;

public class DashboardServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    public DashboardServiceTests()
    {
        _context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    }

    [Fact]
    public async Task Metrics_CountTitlesAndBorrowTransactions()
    {
        _context.Books.Add(new Book { Title = "Book", Author = "Author", ISBN = "ISBN-1", PublicationYear = 2020 });
        _context.Students.Add(new Student { StudentName = "Student", Email = "s@example.test", Phone = "1", RegistrationNumber = "S1" });
        await _context.SaveChangesAsync();
        var metrics = await new DashboardService(_context).GetMetricsAsync();
        Assert.Equal(1, metrics.TotalBooks);
        Assert.Equal(1, metrics.TotalStudents);
        Assert.Equal(0, metrics.TotalBorrowings);
    }

    public void Dispose() => _context.Dispose();
}
