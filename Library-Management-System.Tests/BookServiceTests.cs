using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;
using Library_Management_System.Services;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Tests;

public class BookServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly BookService _service;

    public BookServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        _context = new ApplicationDbContext(options);
        _service = new BookService(_context);
    }

    [Fact]
    public async Task InventoryCountsPhysicalCopiesAndActiveLoans()
    {
        var book = new Book { Title = "Book", Author = "Author", ISBN = "ISBN-1", PublicationYear = 2020 };
        var student = new Student { StudentName = "Student", Email = "s@example.test", Phone = "1", RegistrationNumber = "S1" };
        var available = new BookCopy { Book = book, AccessionNumber = "A1" };
        var borrowed = new BookCopy { Book = book, AccessionNumber = "A2" };
        _context.AddRange(book, student, available, borrowed);
        await _context.SaveChangesAsync();
        _context.BorrowRecords.Add(new BorrowRecord
        {
            StudentId = student.StudentId, BookCopyId = borrowed.BookCopyId,
            BorrowDate = DateTime.UtcNow.AddDays(-1), DueDate = DateTime.UtcNow.AddDays(10)
        });
        await _context.SaveChangesAsync();
        var result = await _service.GetBookByIdAsync(book.BookId);
        Assert.NotNull(result);
        Assert.Equal(2, result.CopyCount);
        Assert.Equal(1, result.AvailableCopyCount);
        Assert.True(result.IsAvailable);
        await Assert.ThrowsAsync<DomainConflictException>(() => _service.DeleteBookAsync(book.BookId));
    }

    [Fact]
    public async Task CreateAndUpdateTitleMetadata()
    {
        var book = await _service.CreateBookAsync(new BookRequestDto
        {
            Title = "First", Author = "Author", ISBN = "ISBN-2", PublicationYear = 2021
        });
        Assert.Equal(0, book.CopyCount);
        var changed = await _service.UpdateBookAsync(book.BookId, new BookRequestDto
        {
            Title = "Second", Author = "Author", ISBN = "ISBN-2", PublicationYear = 2022
        });
        Assert.Equal("Second", changed?.Title);
        Assert.True(await _service.DeleteBookAsync(book.BookId));
    }

    public void Dispose() => _context.Dispose();
}
