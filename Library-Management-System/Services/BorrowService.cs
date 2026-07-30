using Microsoft.EntityFrameworkCore;
using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;

namespace Library_Management_System.Services;

public class BorrowService : IBorrowService
{
    private readonly ApplicationDbContext _context;

    public BorrowService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BorrowRecord> BorrowBookAsync(BorrowRequestDto request)
    {
        var book = await _context.Books.FindAsync(request.BookId);

        if (book == null)
            throw new KeyNotFoundException($"Book with ID {request.BookId} not found.");

        if (!book.IsAvailable)
            throw new InvalidOperationException("This book is already borrowed and not available.");

        var borrowRecord = new BorrowRecord
        {
            BookId = request.BookId,
            BorrowerName = request.BorrowerName,
            BorrowerEmail = request.BorrowerEmail,
            Phone = request.Phone,
            BorrowDate = DateTime.UtcNow
        };

        book.IsAvailable = false;

        _context.BorrowRecords.Add(borrowRecord);
        await _context.SaveChangesAsync();

        return borrowRecord;
    }

    public async Task<BorrowRecord> ReturnBookAsync(int borrowRecordId)
    {
        var borrowRecord = await _context.BorrowRecords
            .Include(br => br.Book)
            .FirstOrDefaultAsync(br => br.BorrowRecordId == borrowRecordId);

        if (borrowRecord == null)
            throw new KeyNotFoundException($"Borrow record with ID {borrowRecordId} not found.");

        if (borrowRecord.ReturnDate != null)
            throw new InvalidOperationException("This book has already been returned.");

        borrowRecord.ReturnDate = DateTime.UtcNow;
        borrowRecord.Book.IsAvailable = true;

        await _context.SaveChangesAsync();

        return borrowRecord;
    }

    public async Task<List<BorrowRecord>> GetAllBorrowRecordsAsync()
    {
        return await _context.BorrowRecords
            .Include(br => br.Book)
            .OrderByDescending(br => br.BorrowDate)
            .ToListAsync();
    }
}
