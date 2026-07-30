using Microsoft.EntityFrameworkCore;
using Library_Management_System.Data;
using Library_Management_System.DTOs;

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
        return new DashboardMetricsDto
        {
            TotalStudents = await _context.Students.CountAsync(),
            TotalBooks = await _context.Books.CountAsync(),
            TotalLibrarians = await _context.Librarians.CountAsync(),
            TotalBorrowings = await _context.BorrowRecords.CountAsync(),
            TotalPublications = await _context.Publications.CountAsync()
        };
    }
}
