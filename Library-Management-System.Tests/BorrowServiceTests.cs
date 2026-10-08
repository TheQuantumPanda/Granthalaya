using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;
using Library_Management_System.Services;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Tests;

public class BorrowServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly BorrowService _service;
    private readonly Student _student = new()
    {
        StudentName = "Test Student", Email = "student@example.test", Phone = "123",
        RegistrationNumber = "TEST-1"
    };
    private readonly Book _book = new()
    {
        Title = "Test Book", Author = "Test Author", ISBN = "TEST-ISBN",
        PublicationYear = 2020
    };
    private BookCopy _copy = null!;

    public BorrowServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        _context = new ApplicationDbContext(options);
        _service = new BorrowService(_context);
        _context.Students.Add(_student);
        _context.Books.Add(_book);
        _copy = new BookCopy { Book = _book, AccessionNumber = "TEST-COPY-1", Condition = "Good" };
        _context.BookCopies.Add(_copy);
        _context.SaveChanges();
    }

    private BorrowRequestDto Request(int? studentId = null, int? copyId = null) => new()
    {
        StudentId = studentId ?? _student.StudentId,
        BookCopyId = copyId ?? _copy.BookCopyId,
        DueDate = DateTime.UtcNow.AddDays(14)
    };

    [Fact]
    public async Task BorrowAvailableCopy_CreatesActiveRecord()
    {
        var record = await _service.BorrowBookAsync(Request());
        Assert.Equal(_student.StudentId, record.StudentId);
        Assert.Equal(_copy.BookCopyId, record.BookCopyId);
        Assert.Null(record.ReturnDate);
        Assert.True(record.DueDate > record.BorrowDate);
    }

    [Fact]
    public async Task BorrowUnavailableCopy_RejectsPhysicalStatus()
    {
        _copy.Status = CopyStatus.Maintenance;
        await _context.SaveChangesAsync();
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.BorrowBookAsync(Request()));
    }

    [Fact]
    public async Task DuplicateActiveBorrow_RejectsSecondRequest()
    {
        await _service.BorrowBookAsync(Request());
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.BorrowBookAsync(Request()));
        Assert.Single(_context.BorrowRecords);
    }

    [Fact]
    public async Task Return_PreservesHistoryAndAllowsAnotherLoan()
    {
        var first = await _service.BorrowBookAsync(Request());
        var returned = await _service.ReturnBookAsync(first.BorrowRecordId);
        Assert.NotNull(returned.ReturnDate);
        var second = await _service.BorrowBookAsync(Request());
        Assert.NotEqual(first.BorrowRecordId, second.BorrowRecordId);
        Assert.Equal(2, await _context.BorrowRecords.CountAsync());
    }

    [Fact]
    public async Task MissingStudentAndCopy_AreRejected()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.BorrowBookAsync(Request(studentId: 9999)));
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.BorrowBookAsync(Request(copyId: 9999)));
    }

    [Fact]
    public async Task OtherCopyOfSameBook_CanBeBorrowed()
    {
        var secondCopy = new BookCopy { BookId = _book.BookId, AccessionNumber = "TEST-COPY-2" };
        _context.BookCopies.Add(secondCopy);
        await _context.SaveChangesAsync();
        await _service.BorrowBookAsync(Request());
        var secondLoan = await _service.BorrowBookAsync(Request(copyId: secondCopy.BookCopyId));
        Assert.Equal(secondCopy.BookCopyId, secondLoan.BookCopyId);
    }

    [Fact]
    public void Model_DefinesFilteredUniqueActiveLoanIndexAndRestrictiveForeignKeys()
    {
        var entity = _context.Model.FindEntityType(typeof(BorrowRecord))!;
        var index = Assert.Single(entity.GetIndexes(), i => i.GetDatabaseName() == "UX_BorrowRecords_ActiveCopy");
        Assert.True(index.IsUnique);
        Assert.Equal("[ReturnDate] IS NULL", index.GetFilter());
        Assert.All(entity.GetForeignKeys(), fk => Assert.Equal(DeleteBehavior.Restrict, fk.DeleteBehavior));
    }

    public void Dispose() => _context.Dispose();
}
