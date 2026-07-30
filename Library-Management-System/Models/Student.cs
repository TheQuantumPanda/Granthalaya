using System.ComponentModel.DataAnnotations;

namespace Library_Management_System.Models;

public class Student
{
    [Key]
    public int StudentId { get; set; }

    public string StudentName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Gender { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;
}
