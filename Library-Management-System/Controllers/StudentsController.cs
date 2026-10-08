using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Library_Management_System.Data;
using Library_Management_System.Models;
using Library_Management_System.Services;

namespace Library_Management_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StudentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET /api/students?searchTerm=...&page=1
    [HttpGet]
    public async Task<IActionResult> GetStudents(
        [FromQuery] string? searchTerm,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Students.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim();
            query = query.Where(s =>
                s.StudentName.Contains(term) ||
                s.Email.Contains(term) ||
                s.Phone.Contains(term));
        }

        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var students = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            students,
            currentPage = page,
            totalPages,
            totalItems
        });
    }

    // GET /api/students/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Student>> GetStudent(int id)
    {
        var student = await _context.Students.FindAsync(id);

        if (student == null)
        {
            return NotFound(new { message = $"Student with ID {id} not found." });
        }

        return Ok(student);
    }

    // POST /api/students
    [HttpPost]
    public async Task<ActionResult<Student>> CreateStudent([FromBody] Student student)
    {
        student.RegistrationNumber = student.RegistrationNumber.Trim();
        _context.Students.Add(student);
        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateException ex) when (PersistenceErrors.IsUniqueViolation(ex))
        {
            return Conflict(new { message = "Registration number already exists." });
        }

        return CreatedAtAction(nameof(GetStudent), new { id = student.StudentId }, student);
    }

    // PUT /api/students/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStudent(int id, [FromBody] Student student)
    {
        if (id != student.StudentId)
        {
            return BadRequest(new { message = "Student ID in URL does not match body." });
        }

        var existing = await _context.Students.FindAsync(id);
        if (existing == null)
        {
            return NotFound(new { message = $"Student with ID {id} not found." });
        }

        existing.StudentName = student.StudentName;
        existing.Email = student.Email;
        existing.Phone = student.Phone;
        existing.RegistrationNumber = student.RegistrationNumber.Trim();
        existing.Gender = student.Gender;
        existing.Address = student.Address;

        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateException ex) when (PersistenceErrors.IsUniqueViolation(ex))
        {
            return Conflict(new { message = "Registration number already exists." });
        }

        return Ok(existing);
    }

    // DELETE /api/students/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStudent(int id)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null)
        {
            return NotFound(new { message = $"Student with ID {id} not found." });
        }

        if (await _context.BorrowRecords.AnyAsync(r => r.StudentId == id))
            return Conflict(new { message = "Students with borrowing history cannot be deleted." });
        _context.Students.Remove(student);
        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateException ex) when (PersistenceErrors.IsForeignKeyViolation(ex))
        {
            return Conflict(new { message = "Student has borrowing history." });
        }

        return Ok(new { message = $"Student '{student.StudentName}' deleted successfully." });
    }
}
