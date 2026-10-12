using Library_Management_System.DTOs;
using Library_Management_System.Security;
using Library_Management_System.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Library_Management_System.Controllers;

[ApiController, Route("api/students"), Authorize(Policy = StaffSecurity.Staff)]
public sealed class StudentsController(IStudentService students) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<StudentPageDto>> GetStudents(string? searchTerm, int page = 1, int pageSize = 5, CancellationToken ct = default) =>
        Ok(await students.ListAsync(searchTerm, page, pageSize, ct));
    [HttpGet("{id:int}")]
    public async Task<ActionResult<StudentDto>> GetStudent(int id, CancellationToken ct) =>
        await students.GetAsync(id, ct) is { } student ? Ok(student) : NotFound();
    [HttpPost]
    public async Task<ActionResult<StudentDto>> CreateStudent([FromBody] StudentRequestDto request, CancellationToken ct)
    {
        var student = await students.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetStudent), new { id = student.StudentId }, student);
    }
    [HttpPut("{id:int}")]
    public async Task<ActionResult<StudentDto>> UpdateStudent(int id, [FromBody] StudentRequestDto request, CancellationToken ct) =>
        await students.UpdateAsync(id, request, ct) is { } student ? Ok(student) : NotFound();
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteStudent(int id, CancellationToken ct) =>
        await students.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
