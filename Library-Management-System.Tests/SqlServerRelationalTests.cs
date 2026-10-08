using Library_Management_System.Data;
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
    public async Task ConcurrentInserts_OnlyOneActiveLoanPerCopy()
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
            }

            async Task<bool> Insert()
            {
                await using var context = new ApplicationDbContext(options);
                context.BorrowRecords.Add(new BorrowRecord
                {
                    StudentId = studentId, BookCopyId = copyId,
                    BorrowDate = DateTime.UtcNow, DueDate = DateTime.UtcNow.AddDays(14)
                });
                try { await context.SaveChangesAsync(); return true; }
                catch (DbUpdateException ex) when (PersistenceErrors.IsUniqueViolation(ex)) { return false; }
            }

            var results = await Task.WhenAll(Task.Run(Insert), Task.Run(Insert));
            Assert.Single(results, x => x);
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
