using System.ComponentModel.DataAnnotations;

namespace Library_Management_System.DTOs;

public sealed class StudentRequestDto
{
    [Required, StringLength(200)] public string StudentName { get; set; } = string.Empty;
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = string.Empty;
    [Required, StringLength(30)] public string Phone { get; set; } = string.Empty;
    [Required, StringLength(50)] public string RegistrationNumber { get; set; } = string.Empty;
    [StringLength(30)] public string Gender { get; set; } = string.Empty;
    [StringLength(500)] public string Address { get; set; } = string.Empty;
}
public sealed record StudentDto(int StudentId, string StudentName, string Email, string Phone,
    string RegistrationNumber, string Gender, string Address);
public sealed record StudentPageDto(IReadOnlyList<StudentDto> Students, int CurrentPage, int TotalPages, int TotalItems);
