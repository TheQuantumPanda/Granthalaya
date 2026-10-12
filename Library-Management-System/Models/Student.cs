using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace Library_Management_System.Models;

public class Student
{
    public int StudentId { get; set; }
    [Required, StringLength(200)] public string StudentName { get; set; } = string.Empty;
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = string.Empty;
    [Required, StringLength(30)] public string Phone { get; set; } = string.Empty;
    [Required, StringLength(50)] public string RegistrationNumber { get; set; } = string.Empty;
    [StringLength(30)] public string Gender { get; set; } = string.Empty;
    [StringLength(500)] public string Address { get; set; } = string.Empty;
    [JsonIgnore] public ICollection<BorrowRecord> BorrowRecords { get; set; } = new List<BorrowRecord>();
}
