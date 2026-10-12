using Library_Management_System.Controllers;
using Library_Management_System.Data;
using Library_Management_System.Models;
using Library_Management_System.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Tests;

public class DeletionControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Student _student;
    private readonly Book _book;
    private readonly BookCopy _copy;

    public DeletionControllerTests()
    {
        _context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        _student = new Student { StudentName = "Student", Email = "student@example.test", Phone = "123", RegistrationNumber = "R-1" };
        _book = new Book { Title = "Book", Author = "Author", ISBN = "ISBN-1", PublicationYear = 2020 };
        _copy = new BookCopy { Book = _book, AccessionNumber = "COPY-1" };
        _context.AddRange(_student, _book, _copy);
        _context.SaveChanges();
        _context.BorrowRecords.Add(new BorrowRecord
        {
            StudentId = _student.StudentId, BookCopyId = _copy.BookCopyId,
            BorrowDate = DateTime.UtcNow.AddDays(-5), DueDate = DateTime.UtcNow.AddDays(5),
            ReturnDate = DateTime.UtcNow.AddDays(-1)
        });
        _context.SaveChanges();
    }

    [Fact]
    public async Task HistoricalLoan_BlocksStudentCopyAndBookDeletion()
    {
        var students = new StudentService(_context);
        var books = new BooksController(new BookService(_context), new BookCopyService(_context));
        await Assert.ThrowsAsync<DomainConflictException>(() => students.DeleteAsync(_student.StudentId, CancellationToken.None));
        await Assert.ThrowsAsync<DomainConflictException>(() => new BookCopyService(_context).DeleteAsync(_book.BookId, _copy.BookCopyId, CancellationToken.None));
        await Assert.ThrowsAsync<DomainConflictException>(() => books.DeleteBook(_book.BookId));
        Assert.Equal(1, await _context.BorrowRecords.CountAsync());
    }

    public void Dispose() => _context.Dispose();
}
