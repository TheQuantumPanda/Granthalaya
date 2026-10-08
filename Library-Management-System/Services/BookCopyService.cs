using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Services;

public interface IBookCopyService
{
    Task<BookCopyDto> CreateAsync(int bookId, BookCopyRequestDto request, CancellationToken ct);
    Task<BookCopyDto?> GetAsync(int bookId, int copyId, CancellationToken ct);
    Task<BookCopyDto?> UpdateAsync(int bookId, int copyId, BookCopyRequestDto request, CancellationToken ct);
    Task<bool> DeleteAsync(int bookId, int copyId, CancellationToken ct);
}
public sealed class BookCopyService(ApplicationDbContext db) : IBookCopyService
{
    private static BookCopyDto Map(BookCopy c, bool active) => new()
    {
        BookCopyId = c.BookCopyId, BookId = c.BookId, AccessionNumber = c.AccessionNumber,
        Condition = c.Condition, Status = c.Status, CreatedAt = c.CreatedAt,
        IsAvailable = !active && c.Status == CopyStatus.Circulating
    };
    public async Task<BookCopyDto> CreateAsync(int bookId, BookCopyRequestDto request, CancellationToken ct)
    {
        if (!await db.Books.AnyAsync(b => b.BookId == bookId, ct)) throw new KeyNotFoundException("Book not found.");
        var copy = new BookCopy { BookId = bookId, AccessionNumber = request.AccessionNumber.Trim(), Condition = request.Condition.Trim(), Status = request.Status };
        db.BookCopies.Add(copy); await db.SaveChangesAsync(ct); return Map(copy, false);
    }
    public async Task<BookCopyDto?> GetAsync(int bookId, int copyId, CancellationToken ct)
    {
        var copy = await db.BookCopies.AsNoTracking().FirstOrDefaultAsync(c => c.BookId == bookId && c.BookCopyId == copyId, ct);
        if (copy is null) return null;
        return Map(copy, await db.BorrowRecords.AnyAsync(r => r.BookCopyId == copyId && r.ReturnDate == null, ct));
    }
    public async Task<BookCopyDto?> UpdateAsync(int bookId, int copyId, BookCopyRequestDto request, CancellationToken ct)
    {
        var copy = await db.BookCopies.FirstOrDefaultAsync(c => c.BookId == bookId && c.BookCopyId == copyId, ct);
        if (copy is null) return null;
        var active = await db.BorrowRecords.AnyAsync(r => r.BookCopyId == copyId && r.ReturnDate == null, ct);
        if (active && request.Status != CopyStatus.Circulating) throw new DomainConflictException("Return the active loan before changing copy status.");
        copy.AccessionNumber = request.AccessionNumber.Trim(); copy.Condition = request.Condition.Trim(); copy.Status = request.Status;
        await db.SaveChangesAsync(ct); return Map(copy, active);
    }
    public async Task<bool> DeleteAsync(int bookId, int copyId, CancellationToken ct)
    {
        var copy = await db.BookCopies.FirstOrDefaultAsync(c => c.BookId == bookId && c.BookCopyId == copyId, ct);
        if (copy is null) return false;
        if (await db.BorrowRecords.AnyAsync(r => r.BookCopyId == copyId, ct)) throw new DomainConflictException("Copies with borrowing history cannot be deleted.");
        db.BookCopies.Remove(copy); await db.SaveChangesAsync(ct); return true;
    }
}
