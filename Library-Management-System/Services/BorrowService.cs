using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Services;

public class BorrowService : IBorrowService
{
    private readonly ApplicationDbContext _context;
    public BorrowService(ApplicationDbContext context) => _context = context;

    public async Task<BorrowRecordDto> BorrowBookAsync(BorrowRequestDto request)
    {
        var now = DateTime.UtcNow;
        if (request.DueDate.Kind != DateTimeKind.Utc || request.DueDate <= now)
            throw new ArgumentException("Due date must be a future UTC timestamp.");
        var student = await _context.Students.FindAsync(request.StudentId)
            ?? throw new KeyNotFoundException($"Student with ID {request.StudentId} not found.");
        var copy = await _context.BookCopies.Include(c => c.Book)
            .FirstOrDefaultAsync(c => c.BookCopyId == request.BookCopyId)
            ?? throw new KeyNotFoundException($"Book copy with ID {request.BookCopyId} not found.");
        if (copy.Status != CopyStatus.Circulating ||
            await _context.BorrowRecords.AnyAsync(r => r.BookCopyId == copy.BookCopyId && r.ReturnDate == null))
            throw new DomainConflictException("This copy is unavailable for borrowing.");

        var record = new BorrowRecord
        {
            StudentId = student.StudentId,
            BookCopyId = copy.BookCopyId,
            BorrowDate = now,
            DueDate = request.DueDate
        };
        _context.BorrowRecords.Add(record);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (PersistenceErrors.IsUniqueViolation(ex))
        {
            throw new DomainConflictException("This copy was borrowed by another request.", ex);
        }
        return Map(record, student, copy);
    }

    public async Task<BorrowRecordDto> ReturnBookAsync(int borrowRecordId)
    {
        var record = await _context.BorrowRecords
            .Include(r => r.Student).Include(r => r.BookCopy).ThenInclude(c => c.Book)
            .FirstOrDefaultAsync(r => r.BorrowRecordId == borrowRecordId)
            ?? throw new KeyNotFoundException($"Borrow record with ID {borrowRecordId} not found.");
        if (record.ReturnDate != null)
            throw new DomainConflictException("This loan has already been returned.");
        record.ReturnDate = DateTime.UtcNow;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            throw new DomainConflictException("This loan was already changed by another request.", ex);
        }
        return Map(record, record.Student, record.BookCopy);
    }

    public async Task<List<BorrowRecordDto>> GetAllBorrowRecordsAsync() =>
        await _context.BorrowRecords.AsNoTracking().OrderByDescending(r => r.BorrowDate)
            .Select(r => new BorrowRecordDto
            {
                BorrowRecordId = r.BorrowRecordId,
                StudentId = r.StudentId,
                StudentName = r.Student.StudentName,
                StudentEmail = r.Student.Email,
                BookCopyId = r.BookCopyId,
                BookId = r.BookCopy.BookId,
                BookTitle = r.BookCopy.Book.Title,
                AccessionNumber = r.BookCopy.AccessionNumber,
                BorrowDate = r.BorrowDate,
                DueDate = r.DueDate,
                ReturnDate = r.ReturnDate
            }).ToListAsync();

    private static BorrowRecordDto Map(BorrowRecord r, Student s, BookCopy c) => new()
    {
        BorrowRecordId = r.BorrowRecordId,
        StudentId = s.StudentId,
        StudentName = s.StudentName,
        StudentEmail = s.Email,
        BookCopyId = c.BookCopyId,
        BookId = c.BookId,
        BookTitle = c.Book.Title,
        AccessionNumber = c.AccessionNumber,
        BorrowDate = r.BorrowDate,
        DueDate = r.DueDate,
        ReturnDate = r.ReturnDate
    };
}
