using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Services;

public interface IStudentService
{
    Task<StudentPageDto> ListAsync(string? search, int page, int size, CancellationToken ct);
    Task<StudentDto?> GetAsync(int id, CancellationToken ct);
    Task<StudentDto> CreateAsync(StudentRequestDto request, CancellationToken ct);
    Task<StudentDto?> UpdateAsync(int id, StudentRequestDto request, CancellationToken ct);
    Task<bool> DeleteAsync(int id, CancellationToken ct);
}
public sealed class StudentService(ApplicationDbContext db) : IStudentService
{
    private static StudentDto Map(Student s) => new(s.StudentId, s.StudentName, s.Email, s.Phone, s.RegistrationNumber, s.Gender, s.Address);
    private static void Apply(Student s, StudentRequestDto r)
    {
        s.StudentName = r.StudentName.Trim(); s.Email = r.Email.Trim(); s.Phone = r.Phone.Trim();
        s.RegistrationNumber = r.RegistrationNumber.Trim(); s.Gender = r.Gender.Trim(); s.Address = r.Address.Trim();
    }
    public async Task<StudentPageDto> ListAsync(string? search, int page, int size, CancellationToken ct)
    {
        (page, size) = Pagination.Validate(page, size);
        var query = db.Students.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(s => s.StudentName.Contains(term) || s.Email.Contains(term) || s.Phone.Contains(term));
        }
        var total = await query.CountAsync(ct);
        var students = await query.OrderBy(s => s.StudentId).Skip((page - 1) * size).Take(size).ToListAsync(ct);
        return new StudentPageDto(students.Select(Map).ToList(), page, (int)Math.Ceiling(total / (double)size), total);
    }
    public async Task<StudentDto?> GetAsync(int id, CancellationToken ct) =>
        await db.Students.AsNoTracking().FirstOrDefaultAsync(s => s.StudentId == id, ct) is { } student ? Map(student) : null;
    public async Task<StudentDto> CreateAsync(StudentRequestDto request, CancellationToken ct)
    {
        var student = new Student(); Apply(student, request); db.Students.Add(student);
        await db.SaveChangesAsync(ct); return Map(student);
    }
    public async Task<StudentDto?> UpdateAsync(int id, StudentRequestDto request, CancellationToken ct)
    {
        var student = await db.Students.FindAsync([id], ct); if (student is null) return null;
        Apply(student, request); await db.SaveChangesAsync(ct); return Map(student);
    }
    public async Task<bool> DeleteAsync(int id, CancellationToken ct)
    {
        var student = await db.Students.FindAsync([id], ct); if (student is null) return false;
        if (await db.BorrowRecords.AnyAsync(r => r.StudentId == id, ct))
            throw new DomainConflictException("Students with borrowing history cannot be deleted.");
        db.Students.Remove(student); await db.SaveChangesAsync(ct); return true;
    }
}
