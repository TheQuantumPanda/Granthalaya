using Microsoft.EntityFrameworkCore;
using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;

namespace Library_Management_System.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardMetricsDto> GetMetricsAsync()
    {
        var now = DateTime.UtcNow;
        var copyCounts = await _context.BookCopies.AsNoTracking().GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Available = g.Count(c => c.Status == CopyStatus.Circulating &&
                    !c.BorrowRecords.Any(r => r.ReturnDate == null))
            }).FirstOrDefaultAsync();
        var loanCounts = await _context.BorrowRecords.AsNoTracking().GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Active = g.Count(r => r.ReturnDate == null),
                Overdue = g.Count(r => r.ReturnDate == null && r.DueDate < now)
            }).FirstOrDefaultAsync();
        return new DashboardMetricsDto
        {
            TotalStudents = await _context.Students.CountAsync(),
            TotalBooks = await _context.Books.CountAsync(),
            TotalLibrarians = await _context.Librarians.CountAsync(),
            TotalBorrowings = loanCounts?.Total ?? 0,
            TotalPublications = await _context.Publications.CountAsync(),
            TotalCopies = copyCounts?.Total ?? 0,
            AvailableCopies = copyCounts?.Available ?? 0,
            BorrowedCopies = loanCounts?.Active ?? 0,
            ActiveLoans = loanCounts?.Active ?? 0,
            ReturnedLoans = (loanCounts?.Total ?? 0) - (loanCounts?.Active ?? 0),
            OverdueLoans = loanCounts?.Overdue ?? 0,
            RecentActivity = await _context.BorrowRecords.AsNoTracking()
                .OrderByDescending(r => r.BorrowDate).ThenByDescending(r => r.BorrowRecordId).Take(5)
                .Select(r => new BorrowRecordDto
                {
                    BorrowRecordId = r.BorrowRecordId, StudentId = r.StudentId,
                    StudentName = r.Student.StudentName, StudentEmail = r.Student.Email,
                    BookCopyId = r.BookCopyId, BookId = r.BookCopy.BookId,
                    BookTitle = r.BookCopy.Book.Title, AccessionNumber = r.BookCopy.AccessionNumber,
                    BorrowDate = r.BorrowDate, DueDate = r.DueDate, ReturnDate = r.ReturnDate
                }).ToListAsync(),
            GenreTitleCounts = await _context.Books.AsNoTracking()
                .GroupBy(b => b.Genre == "" ? "General" : b.Genre)
                .Select(g => new { Genre = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Genre, x => x.Count)
        };
    }
}
