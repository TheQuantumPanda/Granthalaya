using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;
using Library_Management_System.Services;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Tests;

// These tests use a new uniquely named database and delete only that database.
// The supplied connection must permit CREATE DATABASE on an isolated test server.
public sealed class SqlServerFactAttribute : FactAttribute
{
    public SqlServerFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("GRANTHALAYA_TEST_SQL_CONNECTION")))
            Skip = "Set GRANTHALAYA_TEST_SQL_CONNECTION to an isolated SQL Server test instance.";
    }
}

public class SqlServerRelationalTests
{
    private static async Task WithFreshDatabase(Func<DbContextOptions<ApplicationDbContext>, Task> run)
    {
        var baseConnection = Environment.GetEnvironmentVariable("GRANTHALAYA_TEST_SQL_CONNECTION")!;
        var connection = new SqlConnectionStringBuilder(baseConnection)
        {
            InitialCatalog = "Granthalaya_Test_" + Guid.NewGuid().ToString("N"),
            Pooling = false
        }.ConnectionString;
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(connection).Options;
        await using var setup = new ApplicationDbContext(options);
        try
        {
            await setup.Database.MigrateAsync();
            await run(options);
        }
        finally
        {
            await setup.Database.EnsureDeletedAsync();
        }
    }

    [SqlServerFact]
    public async Task LoanAndInquiryPagination_IsStableFilteredAndBounded()
    {
        await WithFreshDatabase(async options =>
        {
            await using var db = new ApplicationDbContext(options);
            var student = new Student { StudentName = "Page Reader", RegistrationNumber = "PAGE-REG", Email = "page@example.test", Phone = "0" };
            var date = DateTime.UtcNow.AddDays(-10);
            for (var i = 0; i < 7; i++)
            {
                db.BorrowRecords.Add(new BorrowRecord
                {
                    Student = student,
                    BookCopy = new BookCopy { AccessionNumber = $"PAGE-COPY-{i}", Book = new Book { Title = $"Page Title {i}", Author = "Author", ISBN = $"PAGE-ISBN-{i}", PublicationYear = 2025 } },
                    BorrowDate = date, DueDate = i % 3 == 0 ? DateTime.UtcNow.AddDays(-1) : DateTime.UtcNow.AddDays(7),
                    ReturnDate = i % 3 == 2 ? DateTime.UtcNow.AddHours(-1) : null
                });
                db.ContactMessages.Add(new ContactMessage { Name = "Reader", Email = "page@example.test", Subject = $"Page Inquiry {i}", Message = "Test", SubmittedAt = date });
            }
            await db.SaveChangesAsync();
            var loans = new BorrowService(db);
            var first = await loans.GetRecordsAsync(null, "all", 1, 3);
            var second = await loans.GetRecordsAsync(null, "all", 2, 3);
            Assert.Equal(7, first.TotalItems); Assert.Equal(3, first.TotalPages);
            Assert.Equal(new[] { 7, 6, 5 }, first.Records.Select(r => r.BorrowRecordId));
            Assert.Equal(new[] { 4, 3, 2 }, second.Records.Select(r => r.BorrowRecordId));
            Assert.Equal(5, (await loans.GetRecordsAsync("PAGE-REG", "active", 1, 3)).TotalItems);
            Assert.Equal(2, (await loans.GetRecordsAsync(null, "returned", 1, 3)).TotalItems);
            Assert.Equal(3, (await loans.GetRecordsAsync(null, "overdue", 1, 3)).TotalItems);
            Assert.Single((await loans.GetRecordsAsync("Page Title 6", "all", 1, 3)).Records);
            Assert.Empty((await loans.GetRecordsAsync("missing", "all", 1, 3)).Records);
            await Assert.ThrowsAsync<ArgumentException>(() => loans.GetRecordsAsync(null, "unsupported", 1, 5));
            await Assert.ThrowsAsync<ArgumentException>(() => loans.GetRecordsAsync(null, "all", 0, 5));
            await Assert.ThrowsAsync<ArgumentException>(() => loans.GetRecordsAsync(null, "all", 1, 101));
            var directory = new DirectoryService(db);
            var inbox = await directory.ContactMessagesAsync(null, 1, 3, CancellationToken.None);
            Assert.Equal(7, inbox.TotalItems); Assert.Equal(new[] { 7, 6, 5 }, inbox.Messages.Select(x => x.Id));
            Assert.Single((await directory.ContactMessagesAsync("Inquiry 6", 1, 3, CancellationToken.None)).Messages);
            Assert.Empty((await directory.ContactMessagesAsync(null, 4, 3, CancellationToken.None)).Messages);
            await Assert.ThrowsAsync<ArgumentException>(() => directory.ContactMessagesAsync(null, 1, 101, CancellationToken.None));
        });
    }

    [SqlServerFact]
    public async Task SearchPaginationDuplicatesAndDashboard_UsePersistedRecords()
    {
        await WithFreshDatabase(async options =>
        {
            await using var db = new ApplicationDbContext(options);
            var books = new BookService(db);
            var copies = new BookCopyService(db);
            var students = new StudentService(db);
            var first = await books.CreateBookAsync(new BookRequestDto
            {
                Title = "Testing Catalog", Author = "Ada", ISBN = "BATCH4-ISBN-1", PublicationYear = 2025, Genre = "Testing"
            });
            await books.CreateBookAsync(new BookRequestDto
            {
                Title = "Another Title", Author = "Bob", ISBN = "BATCH4-ISBN-2", PublicationYear = 2025, Genre = "History"
            });
            Assert.Equal(1, (await books.GetPaginatedBooksAsync("Ada", 1, 1)).TotalItems);
            Assert.Equal(1, (await books.GetPaginatedBooksAsync("BATCH4-ISBN-1", 1, 1)).TotalItems);
            Assert.Equal(first.BookId, Assert.Single((await books.GetPaginatedBooksAsync(null, 1, 5, false, "Testing")).Books).BookId);
            Assert.Empty((await books.GetPaginatedBooksAsync(null, 3, 1)).Books);
            await Assert.ThrowsAsync<ArgumentException>(() => books.GetPaginatedBooksAsync(null, 0, 5));
            await Assert.ThrowsAsync<ArgumentException>(() => books.GetPaginatedBooksAsync(null, 1, 101));
            await Assert.ThrowsAsync<DomainConflictException>(() => books.CreateBookAsync(new BookRequestDto
            {
                Title = "Duplicate", Author = "Ada", ISBN = first.ISBN, PublicationYear = 2025
            }));

            var copy = await copies.CreateAsync(first.BookId,
                new BookCopyRequestDto { AccessionNumber = "BATCH4-COPY-1" }, CancellationToken.None);
            Assert.Equal(first.BookId, Assert.Single((await books.GetPaginatedBooksAsync(null, 1, 1, true)).Books).BookId);
            await Assert.ThrowsAsync<DomainConflictException>(() => copies.CreateAsync(first.BookId,
                new BookCopyRequestDto { AccessionNumber = copy.AccessionNumber }, CancellationToken.None));
            var student = await students.CreateAsync(new StudentRequestDto
            {
                StudentName = "Search Student", Email = "search@example.test", Phone = "555", RegistrationNumber = "BATCH4-REG-1"
            }, CancellationToken.None);
            Assert.Equal(student.StudentId, Assert.Single((await students.ListAsync("BATCH4-REG-1", 1, 5, CancellationToken.None)).Students).StudentId);
            await Assert.ThrowsAsync<DomainConflictException>(() => students.CreateAsync(new StudentRequestDto
            {
                StudentName = "Duplicate Student", Email = "other@example.test", Phone = "555", RegistrationNumber = student.RegistrationNumber
            }, CancellationToken.None));

            var borrow = new BorrowService(db);
            await Assert.ThrowsAsync<ArgumentException>(() => borrow.BorrowBookAsync(new BorrowRequestDto
            {
                StudentId = student.StudentId, BookCopyId = copy.BookCopyId, DueDate = DateTime.UtcNow.AddSeconds(-1)
            }));
            var loan = await borrow.BorrowBookAsync(new BorrowRequestDto
            {
                StudentId = student.StudentId, BookCopyId = copy.BookCopyId, DueDate = DateTime.UtcNow.AddDays(2)
            });
            var metrics = await new DashboardService(db).GetMetricsAsync();
            Assert.Empty((await books.GetPaginatedBooksAsync(null, 1, 5, true)).Books);
            Assert.Equal(2, metrics.TotalBooks);
            Assert.Equal(1, metrics.GenreTitleCounts["Testing"]);
            Assert.Equal(1, metrics.GenreTitleCounts["History"]);
            Assert.Equal(1, metrics.TotalCopies);
            Assert.Equal(0, metrics.AvailableCopies);
            Assert.Equal(1, metrics.ActiveLoans);
            Assert.Equal(1, metrics.BorrowedCopies);
            Assert.Equal(0, metrics.OverdueLoans);
            Assert.Equal(loan.BorrowRecordId, Assert.Single(metrics.RecentActivity).BorrowRecordId);
            await Assert.ThrowsAsync<DomainConflictException>(() => books.DeleteBookAsync(first.BookId));
            await borrow.ReturnBookAsync(loan.BorrowRecordId);
            metrics = await new DashboardService(db).GetMetricsAsync();
            Assert.Equal(1, metrics.AvailableCopies);
            Assert.Equal(0, metrics.ActiveLoans);
            Assert.Equal(1, metrics.ReturnedLoans);
            await Assert.ThrowsAsync<DomainConflictException>(() => students.DeleteAsync(student.StudentId, CancellationToken.None));
            var secondBookId = await db.Books.Where(b => b.ISBN == "BATCH4-ISBN-2").Select(b => b.BookId).SingleAsync();
            var overdueCopy = new BookCopy { BookId = secondBookId, AccessionNumber = "BATCH4-OVERDUE-COPY" };
            db.BookCopies.Add(overdueCopy);
            await db.SaveChangesAsync();
            db.BorrowRecords.Add(new BorrowRecord
            {
                StudentId = student.StudentId, BookCopyId = overdueCopy.BookCopyId,
                BorrowDate = DateTime.UtcNow.AddDays(-10), DueDate = DateTime.UtcNow.AddDays(-2)
            });
            await db.SaveChangesAsync();
            metrics = await new DashboardService(db).GetMetricsAsync();
            Assert.Equal(1, metrics.OverdueLoans);
            Assert.Equal(1, metrics.ActiveLoans);
            Assert.Equal(1, metrics.AvailableCopies);
        });
    }

    [SqlServerFact]
    public async Task BorrowReturnReborrow_PreservesHistoryAndInventory()
    {
        await WithFreshDatabase(async options =>
        {
            int bookId, studentAId, studentBId;
            int[] copyIds;
            await using (var db = new ApplicationDbContext(options))
            {
                var books = new BookService(db);
                var book = await books.CreateBookAsync(new BookRequestDto
                {
                    Title = "SQL Integration Book", Author = "Test Author", ISBN = "SQL-IT-001",
                    PublicationYear = 2024, Genre = "Testing", Publisher = "Test Press", Description = "Relational integration test"
                });
                bookId = book.BookId;
                var copies = new BookCopyService(db);
                copyIds = new int[3];
                for (var i = 0; i < copyIds.Length; i++)
                    copyIds[i] = (await copies.CreateAsync(bookId, new BookCopyRequestDto { AccessionNumber = $"SQL-IT-COPY-{i + 1}" }, CancellationToken.None)).BookCopyId;
                var students = new StudentService(db);
                studentAId = (await students.CreateAsync(new StudentRequestDto
                {
                    StudentName = "SQL Student A", Email = "sql-a@example.test", Phone = "555-1001", RegistrationNumber = "SQL-A"
                }, CancellationToken.None)).StudentId;
                studentBId = (await students.CreateAsync(new StudentRequestDto
                {
                    StudentName = "SQL Student B", Email = "sql-b@example.test", Phone = "555-1002", RegistrationNumber = "SQL-B"
                }, CancellationToken.None)).StudentId;

                var inventory = await books.GetBookByIdAsync(bookId);
                Assert.Equal(3, inventory!.CopyCount);
                Assert.Equal(3, inventory.AvailableCopyCount);

                var borrow = new BorrowService(db);
                var first = await borrow.BorrowBookAsync(new BorrowRequestDto
                {
                    StudentId = studentAId, BookCopyId = copyIds[0], DueDate = DateTime.UtcNow.AddDays(14)
                });
                inventory = await books.GetBookByIdAsync(bookId);
                Assert.Equal(2, inventory!.AvailableCopyCount);
                Assert.False(inventory.BookCopies.Single(c => c.BookCopyId == copyIds[0]).IsAvailable);
                Assert.True(inventory.BookCopies.Single(c => c.BookCopyId == copyIds[1]).IsAvailable);
                Assert.True(inventory.BookCopies.Single(c => c.BookCopyId == copyIds[2]).IsAvailable);

                await Assert.ThrowsAsync<DomainConflictException>(() => borrow.BorrowBookAsync(new BorrowRequestDto
                {
                    StudentId = studentBId, BookCopyId = copyIds[0], DueDate = DateTime.UtcNow.AddDays(14)
                }));
                await borrow.BorrowBookAsync(new BorrowRequestDto
                {
                    StudentId = studentBId, BookCopyId = copyIds[1], DueDate = DateTime.UtcNow.AddDays(14)
                });
                await borrow.ReturnBookAsync(first.BorrowRecordId);
                inventory = await books.GetBookByIdAsync(bookId);
                Assert.Equal(2, inventory!.AvailableCopyCount);
                Assert.True(inventory.BookCopies.Single(c => c.BookCopyId == copyIds[0]).IsAvailable);

                var third = await borrow.BorrowBookAsync(new BorrowRequestDto
                {
                    StudentId = studentAId, BookCopyId = copyIds[0], DueDate = DateTime.UtcNow.AddDays(14)
                });
                Assert.NotEqual(first.BorrowRecordId, third.BorrowRecordId);
                Assert.Equal(3, await db.BorrowRecords.CountAsync());
                Assert.Equal(1, await db.BorrowRecords.CountAsync(r => r.BookCopyId == copyIds[0] && r.ReturnDate == null));

                await Assert.ThrowsAsync<DomainConflictException>(() => students.DeleteAsync(studentAId, CancellationToken.None));
                await Assert.ThrowsAsync<DomainConflictException>(() => copies.DeleteAsync(bookId, copyIds[0], CancellationToken.None));
                Assert.Equal(3, await db.BorrowRecords.CountAsync());
            }
        });
    }

    [SqlServerFact]
    public async Task ConcurrentBorrowRequests_OnlyOneActiveLoanPerCopy()
    {
        await WithFreshDatabase(async options =>
        {
            int studentAId, studentBId, copyId;
            await using (var seed = new ApplicationDbContext(options))
            {
                var studentA = new Student { StudentName = "Concurrent A", Email = "ca@example.test", Phone = "1", RegistrationNumber = "CA" };
                var studentB = new Student { StudentName = "Concurrent B", Email = "cb@example.test", Phone = "2", RegistrationNumber = "CB" };
                var book = new Book { Title = "Concurrent", Author = "Author", ISBN = "SQL-CON-1", PublicationYear = 2024 };
                var copy = new BookCopy { Book = book, AccessionNumber = "SQL-CON-COPY" };
                seed.AddRange(studentA, studentB, book, copy);
                await seed.SaveChangesAsync();
                studentAId = studentA.StudentId; studentBId = studentB.StudentId; copyId = copy.BookCopyId;
            }

            async Task<bool> Borrow(int studentId)
            {
                await using var context = new ApplicationDbContext(options);
                try
                {
                    await new BorrowService(context).BorrowBookAsync(new BorrowRequestDto
                    {
                        StudentId = studentId, BookCopyId = copyId, DueDate = DateTime.UtcNow.AddDays(14)
                    });
                    return true;
                }
                catch (DomainConflictException) { return false; }
            }

            var results = await Task.WhenAll(Task.Run(() => Borrow(studentAId)), Task.Run(() => Borrow(studentBId)));
            Assert.Single(results, success => success);
            await using var verify = new ApplicationDbContext(options);
            Assert.Equal(1, await verify.BorrowRecords.CountAsync(r => r.BookCopyId == copyId && r.ReturnDate == null));
        });
    }

    [SqlServerFact]
    public async Task Database_RejectsInvalidForeignKeysAndDeletingLoanHistory()
    {
        await WithFreshDatabase(async options =>
        {
            int studentId, copyId;
            await using (var seed = new ApplicationDbContext(options))
            {
                var student = new Student { StudentName = "Test", Email = "s@example.test", Phone = "1", RegistrationNumber = "R1" };
                var book = new Book { Title = "Test", Author = "Author", ISBN = "ISBN1", PublicationYear = 2020 };
                var copy = new BookCopy { Book = book, AccessionNumber = "COPY1" };
                seed.AddRange(student, book, copy);
                await seed.SaveChangesAsync();
                studentId = student.StudentId;
                copyId = copy.BookCopyId;
                seed.BorrowRecords.Add(new BorrowRecord
                {
                    StudentId = studentId, BookCopyId = copyId,
                    BorrowDate = DateTime.UtcNow.AddDays(-2), DueDate = DateTime.UtcNow.AddDays(12),
                    ReturnDate = DateTime.UtcNow.AddDays(-1)
                });
                await seed.SaveChangesAsync();
            }
            await using (var invalid = new ApplicationDbContext(options))
            {
                invalid.BorrowRecords.Add(new BorrowRecord
                {
                    StudentId = 999999, BookCopyId = copyId,
                    BorrowDate = DateTime.UtcNow, DueDate = DateTime.UtcNow.AddDays(14)
                });
                var error = await Assert.ThrowsAsync<DbUpdateException>(() => invalid.SaveChangesAsync());
                Assert.True(PersistenceErrors.IsForeignKeyViolation(error));
            }
            await using (var deleteStudent = new ApplicationDbContext(options))
            {
                deleteStudent.Students.Remove((await deleteStudent.Students.FindAsync(studentId))!);
                var error = await Assert.ThrowsAsync<DbUpdateException>(() => deleteStudent.SaveChangesAsync());
                Assert.True(PersistenceErrors.IsForeignKeyViolation(error));
            }
            await using (var deleteCopy = new ApplicationDbContext(options))
            {
                deleteCopy.BookCopies.Remove((await deleteCopy.BookCopies.FindAsync(copyId))!);
                var error = await Assert.ThrowsAsync<DbUpdateException>(() => deleteCopy.SaveChangesAsync());
                Assert.True(PersistenceErrors.IsForeignKeyViolation(error));
            }
        });
    }
}
